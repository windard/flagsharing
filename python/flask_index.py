# -*- coding: utf-8 -*-

import os
import cgi
import json
import logging
from geventwebsocket.websocket import WebSocket
from flask import Flask, render_template, send_from_directory
from flask_sockets import Sockets


app = Flask(__name__, template_folder="template")
sockets = Sockets(app)
logging.basicConfig(
    format='%(name)-25s %(asctime)s %(levelname)-8s %(lineno)-4d %(message)s',
    datefmt='[%Y %b %d %a %H:%M:%S]',
    level=logging.INFO
)
logger = logging.getLogger(__name__)
client_name = {}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'chatroom.png')


@sockets.route("/websocket")
def sockets(ws):
    # type: (WebSocket) -> None
    on_open(ws)

    while not ws.closed:
        message = ws.receive()
        if message is None:
            on_close(ws)
        else:
            on_message(ws, message)


def on_open(ws):
    # type: (WebSocket) -> None
    ws.send(json.dumps({"action": "needNickname", "message": ""}))


def on_close(ws):
    # type: (WebSocket) -> None
    logger.info("[%s] is leaving", client_name.get(ws, ''))

    for client in ws.handler.server.clients.values():
        if client.ws is not ws:
            client.ws.send(json.dumps({"action": "userQuit", "message": client_name.get(ws, "")}))

    if ws in client_name:
        del client_name[ws]


def on_message(ws, message):
    # type: (WebSocket, str) -> None
    action = cgi.escape(json.loads(message).get('action', ''))
    message = cgi.escape(json.loads(message).get('message', ''))
    if action == "setNickname":

        if len(message) == 0 or len(message) > 20:
            return ws.send(json.dumps({"action": "setNicknameError",
                                       "message": "请填写正确的用户昵称，应在1到20个字符之间。"}))

        if message in client_name.values():
            return ws.send(json.dumps({"action": "setNicknameError", "message": "此昵称已经被占用。"}))

        client_name[ws] = message
        ws.send(json.dumps({"action": "setNicknameSuccess", "message": message}))
        for client in ws.handler.server.clients.values():
            client.ws.send(json.dumps({"action": "userJoin", "message": message}))
        logger.info("[%s] is join in", message)

        ws.send(json.dumps({"action": "serverMessage", "message": "欢迎来到聊天室 :)"}))
        for client in ws.handler.server.clients.values():
            client.ws.send(json.dumps({"action": "userList", "message": client_name.values()}))

        logger.info("user list: %s", ','.join(client_name.values()))
    elif action == "message":

        try:
            for client in ws.handler.server.clients.values():
                client.ws.send(json.dumps({"action": "userMessage",
                                           "message": {"username": client_name.get(ws, ''), "content": message}}))
        except Exception as e:
            ws.send(json.dumps({"action": "sayMessageError", "message": str(e)}))

        logger.info("[%s] : %s", client_name.get(ws, ''), message)
    else:
        logger.warning("unsupported method")


if __name__ == '__main__':
    """
    启动方式：
    gunicorn -b 127.0.0.1:8080 -k flask_sockets.worker flask_index:app
    """
    app.run()
