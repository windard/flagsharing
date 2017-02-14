$(document).ready(function($) {

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

if (!window.MozWebSocket && !window.WebSocket ){
	alert("你的浏览器不支持websocket.");
	return
}

socket = new WebSocket("ws://127.0.0.1:8090/websocket");  

var needNickname = function(){
	console.log("needNickname");
	$("#nickname-error").hide();
	$("#nickname-edit").focus();
	$("#login-modal").modal({
		keyboard:false,
		backdrop:"static"
	});
};

var setNicknameError = function(_error_message){
	console.log("setNicknameError : " + _error_message);
	$("#nickname-error-message").text(_error_message);
	$("#nickname-error").show();
	$('#nickname-edit').focus();
};

var setNicknameSuccess = function(_new_nickname){
	console.log("setNicknameSuccess : " + _new_nickname);
	$("#login-modal").modal("hide");
	$("#my-nickname").text(_new_nickname);
};

var sayMessageError = function(_error_message){
	console.log("sayMessageError: "+sayMessageError);
};

var serverMessage = function(_message){
	console.log("serverMessage: "+_message);
	chat_Socket.serverMessage(_message, chat_Socket.getLocalHMS());
};

var userMessage = function(_message){
	_nick_name = _message.split("$")[0];
	_content = _message.split("$")[1];
	console.log(_nick_name + "say: " + _content);
	chat_Socket.userMessage(_nick_name, _content, chat_Socket.getLocalHMS());
};

var userList = function(_list){
	console.log("userList: "+_list.split("$"));
	_list = _list.split("$");
	chat_Socket.userList(_list);
};

var userJoin = function(_nick_name){
	console.log("userJoin: "+_nick_name);
	if( _nick_name == $("#my-nickname").text())
		return 
    chat_Socket.addUserToList(_nick_name);
    chat_Socket.updateListCount();
    chat_Socket.serverMessage(_nick_name+" 加入了聊天室 (*^__^*) …… ",chat_Socket.getLocalHMS());
};

var userQuit = function(_nick_name){
	console.log("userQuit: "+_nick_name);
    chat_Socket.removeUserFromList(_nick_name);
    chat_Socket.updateListCount();
    chat_Socket.serverMessage(_nick_name+" 离开了聊天室 ( ⊙ o ⊙ ) … ",chat_Socket.getLocalHMS());
};

socket.onmessage = function(event) { 
	action = event.data.slice(0, event.data.indexOf("$$"));
	message = event.data.slice(event.data.indexOf("$$")+2);
	switch (action) {
		case "needNickname": needNickname();
							break;
		case "setNicknameError": setNicknameError(message);
							break;
		case "setNicknameSuccess": setNicknameSuccess(message);
							break;
		case "sayMessageError": sayMessageError(message);
							break;
		case "serverMessage": serverMessage(message);
							break;
		case "userMessage": userMessage(message);
							break;
		case "userList": userList(message);
							break;
		case "userJoin": userJoin(message);
							break;
		case "userQuit": userQuit(message);
							break;
		default:console.log("Error:"+action);
	}
};

socket.onopen = function(event) {
	chat_Socket.serverMessage("你已进入聊天室", chat_Socket.getLocalHMS());
};

socket.onclose = function(event) {
	chat_Socket.serverMessage("聊天室已关闭。。。", chat_Socket.getLocalHMS());
};

chat_Socket = {
	init: function(){
		this.initEmotion();
		this.sendMessage();
		this.sendNickname();
	},
	initEmotion: function(){
		QxEmotion($('#emotion-btn'), $('#input-edit'));
	},
	sendMessage: function(){
		var self = this;
		$("#send-message").on("click", function(event){
			event.preventDefault();
			self.applyMessage();
		});
		$("form").submit(function(event) {
			event.preventDefault();
			self.applyMessage();
		});
	},
	applyMessage: function(){
		var content = $("input[id=input-edit]").val();
		if(content){
			socket.send("message$$"+content);
			$("input[id=input-edit]").val('');
		}
	},
	sendNickname: function(){
		var self = this;
		$("#nickname-edit").keydown(function(event){
			if( event.keyCode == 13)
				self.applyNickname();
		});
		$("#applyNicknameBtn").on('click', function(){
			self.applyNickname();
		})
	},
	applyNickname: function(){
		var nickname_edit = $("#nickname-edit");
		var nickname_error = $("#nickname-error");
		var nickname = nickname_edit.val();
		if (nickname.trim() == ""){
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
		socket.send("setNickname$$"+nickname);
	},
	chatBodyToBottom: function(){
		var chat_body = $('.main .panel-body');
		chat_body[0].scrollTop = chat_body[0].scrollHeight;
	},
	serverMessage: function(_content, _time){
		_content = QxEmotion.Parse(_content);
		var messages = $(".msg-list-body");
		var message = '<div class="text-center sys-message">\
							<span class="sys-tip"> 系统消息: '+_content+'    &nbsp;'+_time+'</span>\
						</div>';
		messages.append(message);
		this.chatBodyToBottom();
	},
	userMessage: function(_nick_name, _content, _time){
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
	userList: function(_list){
		$(".list .list-group").html("");
		if (_list[0] != "")
			for(var i = 0; i < _list.length; i++ ) {
				this.addUserToList(_list[i]);
			};
		this.updateListCount();
	},
	addUserToList: function(_nick_name){
		$(".list .list-group").append('<li class="list-group-item">'+_nick_name+'</li>');
	},
	removeUserFromList: function(_nick_name){
		$(".list .list-group li").each(function(){
			if(_nick_name == $(this).text()){
				$(this).remove();
			}
		});
	},
	updateListCount: function(){
		var list_count = $(".list .list-group").find("li").length + 1;
		$("#list-count").text("当前在线人数："+list_count+"人");
	},
	getLocalHMS: function(){
		return new Date().Format("yyyy-MM-dd hh:mm:ss");
	},
}

chat_Socket.init();

});