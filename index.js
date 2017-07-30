var express = require('express');
var app = express();
var fs = require("fs");

// 设置端口
app.set('port', (process.env.PORT || 8080));

// 设置模板引擎
app.set('view engine', 'ejs');


// 读取public下面的静态文件   css js  img mp3
app.use(express.static(__dirname + '/public'));

// 首页
app.get('/', function(request, response) {
    response.render('pages/index', {
        titile: "机器猫动画"
    });
});


var mediaPath = 'public/mp3/04.mp3';
// 音频请求接口
app.post('/a', function(req, res) {

    fs.readFile(mediaPath, function(err, data) {
        if (err) {
            console.log(err);
        } else {

            res.send(data);
        }
    });
});

// 监听端口  成功以后给予后台打印 启动成功
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
