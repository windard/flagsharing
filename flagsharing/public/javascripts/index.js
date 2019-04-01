$(document).ready(function($) {

var socket = io('ws://localhost:3000', {transports: ['websocket']});

Date.prototype.Format = function(fmt)
{ //author: meizz
  var o = {
    "M+" : this.getMonth()+1,                 //月份
    "d+" : this.getDate(),                    //日
    "h+" : this.getHours(),                   //小时
    "m+" : this.getMinutes(),                 //分
    "s+" : this.getSeconds(),                 //秒
    "q+" : Math.floor((this.getMonth()+3)/3), //季度
    "S"  : this.getMilliseconds()             //毫秒
  };
  if(/(y+)/.test(fmt))
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)
    if(new RegExp("("+ k +")").test(fmt))
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
  return fmt;
}

  var chat_Utils ,      // 聊天室 工具类
      chat_UI    ,      // 聊天室 界面类
      chat_Socket,      // 聊天室 通信类

  chat_Socket = {
    init:function(){
        console.log("Connet to Server ...");

        this.needNickname();
        this.setNicknameError();
        this.setNicknameSuccess();
        this.serverMessage();
        this.userMessage();
        this.userList();
        this.userJoin();
        this.userQuit();
        this.sayMessageSuccess();
    },
    needNickname:function(){
        socket.on("need_nickname", function(){
            $("#nickname-error").hide();
        $('#nickname-edit').focus();
            $("#login-modal").modal({
                keyboard:false,
                backdrop:"static"
                });
        });
    },
    setNickname:function(_nick_name){
        socket.emit("change_nickname", _nick_name);
    },
    setNicknameError:function(){
        socket.on("change_nickname_error", function(_error_message){
            console.log("change_nickname_error : " + _error_message);
            $("#nickname-error-message").text(_error_message);
            $("#nickname-error").show();
            $('#nickname-edit').focus();
            // $("#login-modal").modal("show");
        });
    },
    setNicknameSuccess:function(){
        socket.on("change_nickname_done", function(_new_nickname){
            console.log("change_nickname_done : " + _new_nickname);
            $("#login-modal").modal("hide");
            $("#my-nickname").text(_new_nickname);
        });
    },
    serverMessage:function(){
      socket.on('server_message', function(_message){
        console.log("server say : " + _message);
        chat_UI.serverMessage(_message, chat_Utils.getLocalHMS());
      });
    },
    userMessage:function(){
        socket.on("user_say", function(_nick_name, _message){
            console.log(_nick_name + " say : " + _message);
            chat_UI.userMessage(_nick_name, _message, chat_Utils.getLocalHMS());
        });
    },
    userList:function(){
        socket.on("user_list", function(_list){
            chat_UI.userList(_list);
        });
    },
    userJoin:function(){
        socket.on("user_join", function(_nick_name){
            console.log("user join : " + _nick_name);
            chat_UI.addUserToList(_nick_name);
            chat_UI.updateListCount();
            console.log("server say : "+_nick_name+" 加入了聊天室 (*^__^*) …… ");
            chat_UI.serverMessage(_nick_name+" 加入了聊天室 (*^__^*) …… ",chat_Utils.getLocalHMS());
        });
    },
    userQuit:function(){
        socket.on("user_quit", function(_nick_name){
            console.log("user quit : " + _nick_name);
            chat_UI.removeUserFromList(_nick_name);
            chat_UI.updateListCount();
            console.log("server say : "+_nick_name+" 离开了聊天室 ( ⊙ o ⊙ ) … ");
            chat_UI.serverMessage(_nick_name+" 离开了聊天室 ( ⊙ o ⊙ ) … ",chat_Utils.getLocalHMS());
        });
    },
    sayMessage:function(_content){
        socket.emit("say", chat_Utils.getLocalHMS(), _content);
    },
    sayMessageSuccess:function(){
        socket.on("say_done", function(_nick_name, _content){
            console.log(_nick_name + " say : " + _content);
            chat_UI.userMessage(_nick_name, _content, chat_Utils.getLocalHMS());
        });
    }
  }

  chat_UI = {
    init:function(){
      this.initEmotion()
        this.sendMessage();
        this.sendNickname();
    },
  initEmotion:function(){
    QxEmotion($('#emotion-btn'), $('#input-edit'));
  },
    chatBodyToBottom: function(){
        var chat_body = $('.main .panel-body')[0];
        chat_body.scrollTop = chat_body.scrollHeight;
    },
    sendMessage:function(){
        var self = this;
        $("#send-message").on('click', function(event) {
            event.preventDefault();
            self.applyMessage();
        });
        $('form').submit(function(event){
            event.preventDefault();
            self.applyMessage();
        });
    },
    applyMessage:function(){
        var content = $('input[id=input-edit]').val();
        if(content){
            chat_Socket.sayMessage(content);
        }
        $('input[id=input-edit]').val('');
    },
    sendNickname:function(){
        var self = this;
        $('#nickname-edit').keydown(function(_event) {
            if(13 == _event.keyCode) {
                self.applyNickname();
            }
        });
        $('#applyNicknameBtn').on('click', function(){
            self.applyNickname();
        })
    },
    applyNickname:function(){
        var nickname_edit = $("#nickname-edit");
        var nickname_error = $("#nickname-error");
        var nickname = nickname_edit.val();
        if ("" == nickname.trim()){
            $("#nickname-error-message").text("请填写昵称。");
            nickname_error.show();
            nickname_edit.focus();
            return;
        }
        if (nickname.length > 20 ){
            $("#nickname-error-message").text("昵称过长，长度应小于20个字符。");
            nickname_error.show();
            nickname_edit.focus();
            return;
        }
        chat_Socket.setNickname(nickname);
    },
    serverMessage:function(_content, _time){
      _content = QxEmotion.Parse(_content);
        var messages = $(".msg-list-body");
        var message = '<div class="text-center sys-message">\
                                <span class="sys-tip">系统消息：'+_content+'   '+_time+'</span>\
                            </div>';
        messages.append(message);
        this.chatBodyToBottom();
    },
    userMessage:function(_nick_name, _content, _time){
      _content = QxEmotion.Parse(_content);
        var messages = $(".msg-list-body");
        var nickname = $("#my-nickname").text();
        var textalign = _nick_name == nickname ? "text-right" : "";
        var label =  _nick_name == nickname ? "label-success" : "label-info";
        var message = '<div class="message jumbotron '+textalign+' ">\
                                <div class="message-head">\
                                    <span class="label '+label+'"><span class="glyphicon glyphicon-user"></span>&nbsp;&nbsp;'+_nick_name+'</span>&nbsp;&nbsp;\
                                    <span class="label label-default"><span class="glyphicon glyphicon-time"></span>&nbsp;&nbsp;'+_time+'</span>&nbsp;&nbsp;\
                                </div>\
                                <div class="message-body">\
                                   '+_content+'\
                                </div>\
                            </div>';
        messages.append(message);
        this.chatBodyToBottom();
    },
    userList:function(_user_list){
        $(".list .list-group").html("");
        for(var i=0; i < _user_list.length; i++){
            this.addUserToList(_user_list[i]);
        }
        this.updateListCount();
    },
    addUserToList:function(_nick_name){
        $(".list .list-group").append('<li class="list-group-item">'+_nick_name+'</li>')
    },
    removeUserFromList:function(_nick_name){
        $(".list .list-group li").each(function(){
            if(_nick_name == $(this).text()){
                $(this).remove();
            }
        });
    },
    updateListCount:function(){
        var list_count = $(".list .list-group").find("li").length + 1;
        $("#list-count").text("当前在线人数："+list_count+"人");
    }
  }

  chat_Utils = {
    getLocalHMS: function(){
        // var d = new Date();
        // var r = [d.getYear(), d.getMonth(), d.getDay()];
        // r = r.join('-');
        // var t = [d.getHours(), d.getMinutes(), d.getSeconds()];
        // t = t.map(function(v, i){ return v < 10 ? '0' + v : v; })
        // t = t.join(':');
        // return r + "  " + t;
        return new Date().Format("yyyy-MM-dd hh:mm:ss");
    }
  }

chat_UI.init();
chat_Socket.init();

});