# coding=utf-8

import os
import json
import cgi
# import bleach
import tornado.web
import tornado.ioloop
import tornado.options
import tornado.websocket
import tornado.httpserver

from tornado.options import define, options

define("port", default=8090, help="run on the given port", type=int)

def xssProtect(message):
	return cgi.escape(message)
	# attributes={u'a': [u'href']}
	# return bleach.linkify(bleach.clean(message, attributes=attributes, strip=True))

class MainHandler(tornado.web.RequestHandler):
	"""docstring for MainHandler"""
	def get(self):
		self.render("index.html", title='Flag Sharing')

class ChatSocketHandler(tornado.websocket.WebSocketHandler):
	"""docstring for ChatSocketHandler"""
	connects = set()

	def open(self):
		# print "%s connected"%(id(self))
		self.write_message(json.dumps({"action":"needNickname", "message":""}))

	def on_message(self, message):
		# XSS 过滤
		action = xssProtect(json.loads(message)['action'])
		message = xssProtect(json.loads(message)['message'])
		# action = xssProtect(message[:message.index("$$")])
		# message = xssProtect(message[message.index("$$")+2:])
		if action == "setNickname":

			if len(message) == 0 or len(message) > 20:
				return self.write_message(json.dumps({"action":"setNicknameError", "message":"请填写正确的用户昵称，应在1到20个字符之间。"}))
				# return self.write_message("setNicknameError$$请填写正确的用户昵称，应在1到20个字符之间。")

			if message in [x.username for x in ChatSocketHandler.connects]:
				return self.write_message(json.dumps({"action":"setNicknameError", "message":"此昵称已经被占用。"}))
				# return self.write_message("setNicknameError$$此昵称已经被占用。")

			self.username = message
			self.write_message(json.dumps({"action":"setNicknameSuccess", "message":message}))
			# self.write_message("setNicknameSuccess$$%s"%message)
			ChatSocketHandler.send_all(json.dumps({"action":"userJoin", "message":"message"}))
			# ChatSocketHandler.send_all("userJoin$$%s"%message)

			self.write_message(json.dumps({"action":"serverMessage", "message":"欢迎来到聊天室 :)"}))
			# self.write_message("serverMessage$$欢迎来到聊天室 :)")
			self.write_message(json.dumps({"action":"userList", "message":[x.username for x in ChatSocketHandler.connects]}))
			# self.write_message("userList$$" + "$".join(x.username for x in ChatSocketHandler.connects))
			ChatSocketHandler.connects.add(self)

			# print "%s join"%self.username
			# print [x.username for x in ChatSocketHandler.connects]

		elif action == "message":
			if not self.username:
				return self.write_message(json.dumps({"action":"needNickname", "message":""}))
				# return self.write_message("needNickname$$")

			# print "%s say: %s"%(self.username, message)

			try:
				ChatSocketHandler.send_all(json.dumps({"action":"userMessage", "message":{"username":self.username, "content":message}}))
			except Exception,e:
				self.write_message(json.dumps({"action":"sayMessageError", "message":str(e)}))
				# self.write_message("sayMessageError$$%s"%(str(e)))
		else:
			# print "%s:%s"%(action, message)
			pass

	def on_close(self):
		# print "%s quit"%self.username

		ChatSocketHandler.connects.remove(self)
		ChatSocketHandler.send_all(json.dumps({"action":"userQuit", "message":self.username}))
		# print "%s closed"%(id(self))

	@classmethod
	def send_all(cls, chat):
		for connect in cls.connects:
			connect.write_message(chat)

class NofoundHandler(tornado.web.RequestHandler):
	"""docstring for NofoundHandler"""
	def get(self):
		self.write("<h1>No Found</h1>")
		
if __name__ == '__main__':
	settings = {
		"template_path": os.path.join(os.path.dirname(__file__), "template"),
		"static_path": os.path.join(os.path.dirname(__file__), "static"),
		'default_handler_class': NofoundHandler,
		"debug": True,
	}

	app = tornado.web.Application([
		(r'/', MainHandler),
		(r'/websocket', ChatSocketHandler),
		], **settings)
	http_server = tornado.httpserver.HTTPServer(app)
	http_server.listen(options.port)
	tornado.ioloop.IOLoop.instance().start()