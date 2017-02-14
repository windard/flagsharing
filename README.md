## flagsharing

### node 版本

```
npm install -g cnpm --registry=https://registry.npm.taobao.org
cnpm install
cnpm start
```

使用 socket.io 实现 websocket ，使用 xss-escape 实现 XSS 过滤。

node 版本加上了 历史记录 的功能，使用 `curl http://127.0.0.1:3000/history` 即可在命令行中查看，这也就需要先配置 MySQL 数据库，或者去掉该功能。

### Python 版本

```
pip install -r requirements.txt -i http://pypi.douban.com/simple --trusted-host pypi.douban.com
python index.py
```

使用 tornado.websocket 库实现 websocket，使用 bleach 实现 XSS 过滤。

### 效果

![capture_1.png](images/capture_1.png)

![capture_2.png](images/capture_2.png)