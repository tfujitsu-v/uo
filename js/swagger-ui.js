var LOCAL_STORAGE_KEY = 'keyForSwaggerUI';
var GOOGLE_KEY = 'AIzaSyCSRD6_KIA_QRHqajQNgAhGqeET6jVDo34';

var swaggerUI;
var yamlUrl;
var resultApp;
var conditionApp;
var courseResponse; // search/course/extremeやcourse/editのレスポンス
var map;
var resultObjects = [];
var selectedWithMap = false;

// 初期表示
window.onload = function() {
    if (location.href.indexOf('localhost:') >= 0 && location.href.indexOf('swaggerUI.html') >= 0) {
        yamlUrl = 'http://localhost:7000/docs/api/search/course/extreme.yaml';
    } else {
        yamlUrl = location.href.replace(/\.html/, '.yaml');
    }
    initSwaggerUI(yamlUrl);

    var savedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedKey) {
        var $key = $('#key');
        $key.val(savedKey);
    }

    $('#btnFloatingExecute').click(function() {
        $('button.opblock-control__btn').click();   // Executeボタンクリック
        document.getElementById('map').scrollIntoView();
    });
}

// Authorizeボタンを消す
// https://github.com/swagger-api/swagger-ui/issues/3314
var DisableAuthorizePlugin = function() {
  return {
    wrapComponents: {
      authorizeBtn: () => () => null
    }
  };
};


// 画面表示
function initSwaggerUI(jsonUrl) {
    // https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md
    window.swaggerUI = SwaggerUIBundle({
        url: jsonUrl,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
        ],
        plugins: [
            SwaggerUIBundle.plugins.DownloadUrl,
            DisableAuthorizePlugin,
        ],
        layout: 'StandaloneLayout',
        displayRequestDuration: true,           // Try it outでかかった時間を表示する
        docExpansion: 'full',                           // fullなら全パスを展開した状態にしておく
        defaultModelsExpandDepth: -1,           // -1ならSchemaを表示しない
        defaultModelExpandDepth: 999,           // モデル（レスポンス構造）を何段階展開しておくか
        defaultModelRendering: 'model',     // 初期表示時にExample ValueとSchemaのどちらを表示しておくか
        showExtensions: true,                           // x-で始まるフィールドを表示するか
        showCommonExtensions: true,             // pattern, maxLength, minLength, maximum, minimumを表示するか
        onComplete: function() {
            console.log('swaggerUI.onComplete');
            var savedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedKey) {
                window.swaggerUI.preauthorizeApiKey('ApiKeyAuth', key);
            }
        },
        requestInterceptor: function(data) {
            console.log(data.url);
            return data;
        },
        responseInterceptor: function(data) {
            try {
                // OpenAPIのyamlがロードされた
                if (data.url.match(/\.yaml$/)) {
                    if (data.ok) {
                        // 最初からTry it out状態にしておく方法は無いらしい
                        // https://github.com/swagger-api/swagger-ui/issues/4590
                        // のでアドホックな方法で
                        var clicked = false;
                        function clickTryOutButton() {
                            var $button = $('button.try-out__btn');
                            if ($button.length > 0) {
                                $button.click();
                                clicked = true;
                            } else {
                                setTimeout(clickTryOutButton, 100);
                            }
                        }
                        clickTryOutButton();
                        if (isSearchCourseExtreme()) {
                            addSetWithMapButton();
                            addConditionDetailEditButton();
                        }
                    }
                } else {
                    if (data.ok) {
                        // EWSのJSONレスポンスはContent-Type: text/plain;charset=utf-8
                        // になっており、JSONが整形されずに表示されてしまうので変換しておく
                        if (data.headers['content-type'] == 'text/plain;charset=utf-8') {
                            data.text = JSON.stringify(JSON.parse(data.text), null, 2);
                        }

                        // 経路探索系の場合はGUIで経路表示
                        if (isSearchApi()) {
                            var res = data.body;
                            if (!resultApp) {
                                resultApp = new expGuiCourse(document.getElementById('result'));
                                resultApp.bind('change', onSelectedCourseChanged);
                            }
                            courseResponse = res;
                            resultApp.setResult(res);
                            setTimeout(function() {
                                document.getElementById('map').scrollIntoView();
                            }, 100);

                            drawRouteOnMap();
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            }
            return data;
        },
        // parameterMacroはバグで機能しないらしい
        // https://github.com/swagger-api/swagger-ui/issues/5282
        //parameterMacro: function(a, b) {
        //return 'mogera';
        //}
    });

    if (isSearchApi()) {
        $('body').append('<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_KEY + '&libraries=places&callback=readyGmapLibrary" defer></script>');
    }
}

function isSearchCourseExtreme() {
    if (yamlUrl.match(/extreme\.yaml/)) {
        return true;
    } else {
        return false;
    }
}

function isSearchApi() {
    if (yamlUrl.match(/extreme\.yaml/) || yamlUrl.match(/course\/edit\.yaml/)) {
        return true;
    } else {
        return false;
    }
}

function readyGmapLibrary() {
    console.log("readyGmapLibrary!");
    $('#map').show();
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 35.68131, lng: 139.767234 },
        zoom: 13,
        scaleControl: true,
        clickableIcons: false,
        //gestureHandling: 'greedy',
    });

    map.addListener('click', function(e) {
        var lat = GMapUtil.round(e.latLng.lat(), 6);
        var lng = GMapUtil.round(e.latLng.lng(), 6);
        $('#clickedPoint').text(lat + ',' + lng);
    });

    var clickedPointInput = document.getElementById('clickedPoint');
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(clickedPointInput);

    GMapUtil.enableSaveInitialView(map, 'swaggerUI-map-view');

    GMapUtil.addAddressBox(map, 'address');

    GMapUtil.enableSetOriginDestination(map, function(as, lat, lng) {
        lat = GMapUtil.round(lat, 6);
        lng = GMapUtil.round(lng, 6);
        var latLngStr = lat + ',' + lng;
        var viaListLatLngs = getViaListLatLngs();
        if (as == 'origin') {
            var viaListText = lat + ',' + lng;
            if (viaListLatLngs.length > 0) {
                 viaListText += ':' + viaListLatLngs[viaListLatLngs.length - 1].lat + ',' + viaListLatLngs[viaListLatLngs.length - 1].lng;
            }
        } else if (as == 'destination') {
            var viaListText = ''; 
            if (viaListLatLngs.length > 0) {
                viaListText += viaListLatLngs[0].lat + ',' + viaListLatLngs[0].lng;
            }
            viaListText += ':' + lat + ',' + lng;
        }
        $('#viaListText').text(viaListText);
        var $textbox = $('tr[data-param-name=viaList]').find('td.parameters-col_description').find('input[type=text]');
        if ($textbox.length == 0) {
            alert('テキストボックスが見つかりません');
            return;
        }
        setParameterValue($textbox.get(0), viaListText);
        selectedWithMap = true;
    });
}

function saveKey() {
    var $key = $('#key');
    var key = $key.val();
    if (key != '') {
        localStorage.setItem(LOCAL_STORAGE_KEY, key);
        window.swaggerUI.preauthorizeApiKey('ApiKeyAuth', key);
        alert('アクセスキーをブラウザに保存しました。\nExecuteではこのアクセスキーが使われます。');
    }
}

// isReadyがtrueになるまで待ってからfuncを実行する関数を返す
function waitUntilReady(isReady, func) {
    return (function() {
        var done = false;
        if (isReady()) {
            console.log("ready");
            func();
            done = true;
        } else {
            console.log("not ready");
            setTimeout(arguments.callee, 100);  // 無名関数の再帰
        }
    });
}

function addSetWithMapButton() {
    waitUntilReady(function() {
        return $('tr[data-param-name=viaList]').find('td.parameters-col_description').length > 0;
    }, function() {
        var $button = $('<button id="btn-set-with-map" class="btn-primary">地図で選択</button>');
        $button.click(function() {
            document.getElementById('map').scrollIntoView();
        });
        return $('tr[data-param-name=viaList]').find('td.parameters-col_description').append($button);
    })();
}

function addConditionDetailEditButton() {
    waitUntilReady(function() {
        return $('tr[data-param-name=conditionDetail]').find('td.parameters-col_description').length > 0;
    }, function() {
        var $button = $('<button id="btn-set-condition-detail" class="btn-primary">探索条件をテキストボックスにセット</button>');
        $button.click(function() {
            var cd = conditionApp.getConditionDetail();
            console.log('cd:', cd);
            var $input = $(this).parent().children('input[type=text]');
            setParameterValue($input.get(0), cd);
        });
        $('tr[data-param-name=conditionDetail]').find('td.parameters-col_description').append('<div id="conditionApp"></div>').append($button);

        conditionApp = new expGuiCondition(document.getElementById("conditionApp"));

        // 表示タブ
        conditionApp.setConfigure('answerCount', 'hidden');
        conditionApp.setConfigure('sortType', 'hidden');
        conditionApp.setConfigure('priceType', 'hidden');
        //// 平均経路タブ
        //conditionApp.setConfigure('walk', 'hidden');
        //conditionApp.setConfigure('useJR', 'hidden');
        //conditionApp.setConfigure('expressStartingStation', 'hidden');
        //conditionApp.setConfigure('waitAverageTime', 'hidden');
        //conditionApp.setConfigure('waitAverageTime', 'hidden');

        conditionApp.dispCondition();
    })();
}

function toArray(obj) {
    if (obj === undefined || obj === null)
        return [];
    return (obj instanceof Array) ? obj : [obj];
}


function onSelectedCourseChanged() {
    drawRouteOnMap(resultApp)
}

function clearResultObjects() {
    resultObjects.forEach(function(obj) {
        obj.setMap(null);
    });
    resultObjects = [];
}

function latLngStrToObject(latlngStr) {
    var a = latlngStr.split(',');
    if (a.length == 2) {
        return {
            lat: parseFloat(a[0]),
            lng: parseFloat(a[1]),
        };
    } else {
        throw new Error('緯度経度の文字列不正');
    }
}

function getViaListLatLngs() {
    var val = $('tr[data-param-name=viaList]').find('input[type=text]').val();
    if (val == undefined)
        return [];
    else
        return val.split(':').map((str) => latLngStrToObject(str));
}

function drawRouteOnMap() {
    clearResultObjects();

    var resultNo = resultApp.getResultNo();
    console.log("resultNo", resultNo);

    var courses = toArray(courseResponse.ResultSet.Course);
    if (courses.length == 0) {
        alert('No route\n経路が見つかりませんでした');
        return;
    }
    var lines = toArray(courses[resultNo - 1].Route.Line);
    var points = toArray(courses[resultNo - 1].Route.Point);

    var viewport = new google.maps.LatLngBounds();
    var pointPositions = [];
    points.forEach(function(point, index) {
        var position = null;
        var content = '';
        if (point.GeoPoint) {
            position = { lat: parseFloat(point.GeoPoint.lati_d), lng: parseFloat(point.GeoPoint.longi_d) };
            content = point.Name ? point.Name : ('<b>' + point.Station.Name + '</b><br>' + point.Station.code);
        } else if (index == 0) {
            var viaList = getViaListLatLngs();
            if (viaList[0]) {
                position = viaList[0];
                content = '<b>出発地</b>';
            }
        } else if (index == points.length - 1) {
            var viaList = getViaListLatLngs();
            if (viaList[viaList.length - 1]) {
                position = viaList[viaList.length - 1];
                content = '<b>目的地</b>';
            }
        }

        pointPositions.push(position);

        if (position != null) {
            var marker = new google.maps.Marker({
                map: map,
                position: position,
            });
            var infowin = new google.maps.InfoWindow({ content: content });
            var persistent = false;
            marker.addListener('click', function() {
                persistent = true;
            });
            marker.addListener('mouseover', function() {
                infowin.open(map, marker);
            });
            marker.addListener('mouseout', function() {
                if (!persistent) {
                    infowin.close();
                }
            });
            resultObjects.push(marker);
            viewport.extend(position);
        }
    });

    lines.forEach(function(line, index) {
        var color = getLineColor(line);
        var path = [pointPositions[index], pointPositions[index + 1]];
        if (path[0] != null && path[1] != null) { // シリアライズデータから再現した場合は発着地の緯度経度がないので
            var content = '<b>' + line.Name + '</b><br>' + line.timeOnBoard + '分';
            var infowin = new google.maps.InfoWindow({ content: content });
            var persistent = false;
            var poly = new google.maps.Polyline({
                strokeColor: color,
                strokeOpacity: 1,
                strokeWeight: 5,
                path: path,
                map: map
            });
            poly.addListener('click', function(e) {
                persistent = true;
            });
            poly.addListener('mouseover', function(e) {
                infowin.setPosition(e.latLng);
                infowin.open(map);
            });
            poly.addListener('mouseout', function(e) {
                if (!persistent) {
                    infowin.close();
                }
            });
            resultObjects.push(poly);
        }
    });

    // 地図から発着地を選択した場合は既に見やすい状態になっているはずなのでfitBoundsしない
    if (!selectedWithMap) {
        map.fitBounds(viewport);
    }
}

function getLineColor(line) {
    var color;
    if (line.Color && line.Color != '230230230') {  // 徒歩のグレーは見づらいので使わないようにする
        color = lineColorToRGB(line.Color);
    } else {
        color = '#000000';
    }
    return color;
}

function lineColorToRGB(lineColor) {
    var result = '#' +
        ('00' + parseInt(lineColor.substr(0, 3)).toString(16)).slice(-2) +
        ('00' + parseInt(lineColor.substr(3, 3)).toString(16)).slice(-2) +
        ('00' + parseInt(lineColor.substr(6, 3)).toString(16)).slice(-2);
    return result;
}

// SwaggerUIは内部でReactを使っており、Reactの管理下にあるDOMに対してはjQueryで
// $(element).val('hoge') などとやっても表面上の値はセットできるが、SwaggerUIがExecuteするときの
// パラメータまでは変わらない。
// そこでこれを使ってReactのstateそのものを変更する必要がある。
// textareaの場合はHTMLTextAreaElementのprototypeを使えばいいらしい。
//
// https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js
function setParameterValue(input, value) {
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(input, value);

    var ev2 = new Event('input', { bubbles: true});
    input.dispatchEvent(ev2);
}

//// https://stackoverflow.com/questions/29321742/react-getting-a-component-from-a-dom-element-for-debugging/39165137#39165137
//window.FindReact = function(dom) {
//    let key = Object.keys(dom).find(key=>key.startsWith("__reactInternalInstance$"));
//    let internalInstance = dom[key];
//    if (internalInstance == null) return null;
//
//    if (internalInstance.return) { // react 16+
//        return internalInstance._debugOwner
//            ? internalInstance._debugOwner.stateNode
//            : internalInstance.return.stateNode;
//    } else { // react <16
//        return internalInstance._currentElement._owner._instance;
//    }
//}
