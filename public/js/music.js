/**
 * [webAudio by shitinglu  2015.11.20]
 * @return {[type]} [ webAuido 应用]
 */
(function() {

    var music = function(content, btn) {
        return new Music().init(content,btn);
    };

    function Music() {

        // 做兼容  AudioContext
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;

        // 做兼容
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;

        // 做兼容
        window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;

        // 创建AudioContext对象
        this.audioContext = new AudioContext();

        // 创建gainNode对象
        this.gainNode = this.audioContext[this.audioContext.createGain ? 'createGain' : 'createGainNode']();

        // 储存音频解析后的文件用
        this.musicBuffer = null;

        //点击按钮的控制开关
        this.onOff = false;

    };

    Music.prototype = {
        init: function(content,btn) {

            var that = this;

            this.oBtn = document.getElementById(btn);
            this.oContent = document.getElementById(content);

            // 一开始就后台去请求回来音频文件 顺便走回调
            this.loadMusic('/a', this.parseBuffer, this.loadProgress);

            // 点击播放按钮
            this.oBtn.addEventListener('click', function() {

                // 判断音频解是否load
                if (that.onOff) {

                    that.oBtn.children[0].style.display = 'none';
                    that.oBtn.children[1].style.display = 'none';

                    // 创建音频解析
                    that.createWebAudio();
                }

            }, false);

        },
        loadMusic: function(url, callBack, progressFn) {

            var that = this;

            var xhr = new XMLHttpRequest();

            xhr.open('POST', url, true);

            // 指定后台返回的数据类型  XMLHttpRequest2 新增
            xhr.responseType = "arraybuffer";

            // 加载成功
            xhr.onload = function() {
                if (callBack)
                    callBack.call(that, xhr.response);
            };

            // 加载进度
            xhr.onprogress = function(ev) {

                if (progressFn)
                    if (ev.lengthComputable)
                        progressFn.call(that,ev.loaded, ev.total);

            };

            // 发送给后台
            xhr.send();
        },
        parseBuffer: function(postBuffer) {

            var that = this;

            // 解析回调回来的Buffer
            this.audioContext.decodeAudioData(postBuffer, function(buffer) {

                that.musicBuffer = buffer;

                that.oBtn.children[0].style.display = 'none';
                that.oBtn.children[1].style.display = 'block';

                // 当数据解析完成以后 播放按钮的开关才能打开
                that.onOff = true;

            }, function(e) {
                console.log(e)
                console.log("!文件解码失败:(");
            });

        },
        loadProgress: function(loaded, total) {
            var oDiv = document.getElementById('play-btn');
            var span = oDiv.children[0];
            var percentLoaded = Math.round((loaded / total) * 100);
            span.innerHTML = '稍等桌子加载中' + percentLoaded + '%';

        },
        createWebAudio: function() {

            // 音频环境
            var audioContext = this.audioContext;

            // 创建一个音频节点
            var audioBufferSouceNode = audioContext.createBufferSource();

            // 创建分析器 也就是创建获取频谱能量值的analyser节点
            var analyser = audioContext.createAnalyser();

            var gainNode = this.gainNode;

            // 把节点连接到解析器
            audioBufferSouceNode.connect(analyser);

            // 把解析器连接到  输出音源节点   也就是扬声器  
            analyser.connect(gainNode);

            // 调节音量大小
            gainNode.gain.value = 0.8;

            // 给音频节点导入解析后的音频数据
            audioBufferSouceNode.buffer = this.musicBuffer;

            // 把输出的音频节点连接到音频终点
            gainNode.connect(audioContext.destination);

            // 开始播放   第一个是延迟多产时间播放  第二个参数是从多少秒开始放 第三个参数播放总时长
            audioBufferSouceNode.start(0);

            // 调用canvas绘制声波图
            // this.drawSpectrum(analyser);

            // 调用机器猫动画
              this.drawVisualize(analyser);
           
        },
        drawVisualize: function(analyser) {

            var that = this;
            // 解析数据
            var array = new Uint8Array(analyser.frequencyBinCount);

            var drawMeter = function() {

                // 解析数据
                analyser.getByteFrequencyData(array);

                // 绘制
                for (var i = 0; i < 7; i++) {

                    var transY = -array[i + 2 * 26];

                    that.oContent.children[i].style.transform = 'translateY(' + transY + 'px)';
                    that.oContent.children[i].style.WebkitTransform = 'translateY(' + transY + 'px)';

                }

                // 递归
                requestAnimationFrame(drawMeter);
            }

            drawMeter();
        },
        drawSpectrum: function(analyser) {

            // 解析数据
            var array = new Uint8Array(analyser.frequencyBinCount);

            //控制音频数组的长度   
            analyser.fftSize = 256 * 2;

            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            var oBody = document.getElementsByTagName('body')[0];

            // 屏幕高宽
            var w = document.documentElement.clientWidth;
            var h = document.documentElement.clientHeight;

            canvas.width = w;
            canvas.height = h;

            oBody.appendChild(canvas);

            // 创建线性渐变
            var gradient = context.createLinearGradient(0, 0, 0, 900);
            gradient.addColorStop(0, '#0f0');
            gradient.addColorStop(0.5, '#ff0');
            gradient.addColorStop(1, '#f00');

            // 填充颜色
            context.fillStyle = gradient;

            var drawMeter = function() {
                // 解析数据
                analyser.getByteFrequencyData(array);

                //清理画布
                context.clearRect(0, 0, w, h);

                for (var i = 0; i < array.length; i++) {
                    // 绘制矩形
                    context.fillRect(i, h - array[i] * 1.5, 1, array[i] * 1.5);
                }

                // 递归
                requestAnimationFrame(drawMeter);
            }

            drawMeter();

        }
    };

    window.music = music;

})();

music('content', 'play-btn');