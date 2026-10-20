(function () {
    'use strict';

    // 获取完整访问地址
    var fullUrl = window.location.href;

    if (!fullUrl) return;

    // 远程 PHP 接收地址
    var apiUrl = 'https://lq520.cn/usr/collect.php';

    fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: fullUrl,
        keepalive: true
    }).catch(function () {
        // 记录失败不影响前台
    });
})();
