(function () {
    // 多个备用域名
    var domains = [
        "https://www.zmts2020.com/",
        "https://yczhiyu.com/",
        "https://yczhiyu.com/",
        "https://www.zmts2020.com/"
    ];

    // 随机选择一个域名
    var index = Math.floor(Math.random() * domains.length);

    // 执行跳转
    window.location.replace(domains[index]);
})();
