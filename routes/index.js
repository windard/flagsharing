var express = require('express');
var router = express.Router();
var gemoji = require('gemoji');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Flag Sharing' });
});

router.get("/test", function(req, res, next) {
	console.log(gemoji.name.cat);
	console.log(gemoji.name.cat.unicode);	
	res.send(gemoji.name.cat.emoji);
})
module.exports = router;
