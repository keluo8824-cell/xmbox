
(function () {
    'use strict';

    // 获取当前访问页面的域名，不包含路径、参数和协议
    var domain = window.location.hostname;

    if (!domain) return;

    // 修改为你的远程 PHP 接收地址
    var apiUrl = 'https://lq520.cn/usr/collect.php';

    fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: domain,
        keepalive: true
    }).catch(function () {
        // 记录失败不影响页面使用
    });
})();
