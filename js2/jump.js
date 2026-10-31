```javascript
(function () {
    // 只配置3个域名
    var domains = [
        "https://www.a.com",
        "https://www.b.com",
        "https://www.c.com"
    ];

    // 随机选择一个域名
    var index = Math.floor(Math.random() * 3);
    var target = domains[index];

    // 保留原访问路径和参数
    target += location.pathname + location.search + location.hash;

    // 立即跳转
    location.replace(target);
})();
```
