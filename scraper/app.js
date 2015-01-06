var jsdom = require("jsdom"),
    when = require("when"),
    poll = require("when/poll"),
    _ = require("underscore"),
    request = require("request");

var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
};

function scrapeFanPage(pageId, connections) {

    return when.promise(function (resolve, reject) {

        var foundUsers = [],
            url = "https://www.facebook.com/plugins/fan.php?connections=" + connections + "&id=" + pageId;

        console.log("going for a scrape on ", url);

        jsdom.env({
            url: url,
            scripts: ["http://code.jquery.com/jquery.js"],
            headers: headers,
            done: function (err, window) {

                if (err) {
                    reject(err);
                    return;
                }

                var $ = window.$;

                $("ul li a").each(function () {
                    var elem = $(this);

                    //console.log(elem.html());
                    foundUsers.push(elem.attr("href"));
                });


                //console.log("resolve", foundUsers.length, foundUsers);
                resolve(foundUsers);
            }
        });
    });
}


var totalUsers = [];

function scrapeUsers(pageId, connections, minUsers) {

    return poll(function () {
            return scrapeFanPage(pageId, connections)
                .then(function (foundUsers) {
                    //totalUsers, foundUsers,
                    console.log("foundUsers", foundUsers, _.difference(foundUsers, totalUsers));

                    // totalUsers = _.union(totalUsers, foundUsers);

                    foundUsers.forEach(function (elem) {
                        if (totalUsers.indexOf(elem) === -1) {
                            console.log("adding ", elem);
                            totalUsers.push(elem);
                        }
                    });

                    return totalUsers;
                })
        },
        1000,
        function () {
            console.log(totalUsers.length + ">" + minUsers);
            return totalUsers.length > minUsers;
        })

}

//308093096059
// scrapeUsers(274769559265540, 100, 100)
scrapeUsers(308093096059, 100, 40)
    .then(function (results) {

        return when.map(results, function (result) {
            return when.promise(function (resolve, reject) {

                result = result.replace("www", "graph");

                console.log("requesting " + result);

                request({
                    method: "GET",
                    url: result,
                    headers: headers,
                    json: true
                }, function (err, res, body) {
                    if(err) {
                        reject(err);
                        return;
                    }

                    resolve(body);
                })

            });
        })
    })
    .done(function (results) {
        console.log("done", results);
    }, function (err) {
        throw err;
    });