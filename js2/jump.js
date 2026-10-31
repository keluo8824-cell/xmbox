(function () {
    // 多个备用域名
    var domains = [
        "https://www.a.com/",
        "https://www.b.com/",
        "https://www.c.com/",
        "https://www.d.com/"
    ];

    // 随机选择一个域名
    var index = Math.floor(Math.random() * domains.length);

    // 执行跳转
    window.location.replace(domains[index]);
})();