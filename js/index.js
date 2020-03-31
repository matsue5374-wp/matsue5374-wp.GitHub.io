// 地図表示時の中心座標
var init_center_coords = [133.050485, 35.474598];

// Bing APIのキー
// var bing_api_key = 'AhGQykUKW2-u1PwVjLwQkSA_1rCTFESEC7bCZ0MBrnzVbVy7KBHsmLgwW_iRJg17';
// 取得した 'xf6mYY67aVRjSM9h3OSl~9x_OHGoeezV8H-19y02qWw~AnEVkjQ7uqxdSV6HsOjZnXodLAgK-XgU77xBwfej9Cm9TcBWU-LPh2aQVc_RzH-w';
var bing_api_key = 'AgLf0SuOSdS4m_KaWrFtqI4hy1GdVNs8c39CQUM2gGBzgfPax77xUdL_cPlckXUN';

//BdNzmM0t29np9HL97bQc~xYYmX2cxdMWaQwceYsbTYg~AgLf0SuOSdS4m_KaWrFtqI4hy1GdVNs8c39CQUM2gGBzgfPax77xUdL_cPlckXUN

//xf6mYY67aVRjSM9h3OSl~9x_OHGoeezV8H-19y02qWw~AnEVkjQ7uqxdSV6HsOjZnXodLAgK-XgU77xBwfej9Cm9TcBWU-LPh2aQVc_RzH-w

// map
var map;

// 保育施設JSON格納用オブジェクト
var nurseryFacilities = {};

// 中心座標変更セレクトボックス用データ
var moveToList = [];

// マップサーバ一覧
var mapServerList = {
	'bing-road': {
		label: "標準(Bing)",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Road',
		})
	},
	"cyberjapn-pale": {
		label: "国土地理院",
		source_type: "xyz",
		source: new ol.source.XYZ({
			attributions: [
				new ol.Attribution({
					html: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>国土地理院</a>"
				})
			],
			url: "http://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	},
	'osm': {
		label: "交通",
		source_type: "osm",
		source: new ol.source.OSM({
			url: "http://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png",
			attributions: [
				ol.source.OSM.DATA_ATTRIBUTION,
				new ol.Attribution({html: "Tiles courtesy of <a href='http://www.thunderforest.com/' target='_blank'>Andy Allan</a>"})
			]
		})
	},
	'bing-aerial': {
		label: "写真",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Aerial',
		})
	}
};

/**
 * デバイス回転時、地図の大きさを画面全体に広げる
 * @return {[type]} [description]
 */
function resizeMapDiv() {
	var screenHeight = $.mobile.getScreenHeight();
	var contentCurrentHeight = $(".ui-content").outerHeight() - $(".ui-content").height();
	var contentHeight = screenHeight - contentCurrentHeight;
	var navHeight = $("#nav1").outerHeight();
	$(".ui-content").height(contentHeight);
	$("#map").height(contentHeight - navHeight);
}

$(window).on("orientationchange", function() {
	resizeMapDiv();
	map.setTarget('null');
	map.setTarget('map');
});


$('#mainPage').on('pageshow', function() {
	resizeMapDiv();

	// 地図レイヤー定義
	var papamamap = new Papamamap();
	papamamap.viewCenter = init_center_coords;
	papamamap.generate(mapServerList['bing-road']);
//	papamamap.generate(mapServerList['mierune-normal']);
	map = papamamap.map;
	
	window.alert('①');
	
	// 保育施設の読み込みとレイヤーの追加
	papamamap.loadNurseryFacilitiesJson(function(data){
		nurseryFacilities = data;
	}).then(function(){
		// ☆papamamap.addNurseryFacilitiesLayer(nurseryFacilities);
	});

	window.alert('③');
	
	// ポップアップ定義
	var popup = new ol.Overlay({
		element: $('#popup')
	});
	map.addOverlay(popup);
	
	window.alert('④');

	// 背景地図一覧リストを設定する
	for(var item in mapServerList) {
		option = $('<option>').html(mapServerList[item].label).val(item);
		$('#changeBaseMap').append(option);
	}
	
	window.alert('⑤');

	// 最寄駅セレクトボックスの生成
    /* 未使用
	mtl = new MoveToList();
	mtl.loadStationJson().then(function() {
		mtl.appendToMoveToListBox(moveToList);
	}, function(){
		mtl.loadStationJson().then(function() {
			mtl.appendToMoveToListBox(moveToList);
		});
	});
    */
    
	// 保育施設クリック時の挙動を定義
	map.on('click', function(evt) {
		if ( $('#popup').is(':visible') ) {
			// ポップアップを消す
			$('#popup').hide();
			return;
		}

		// クリック位置の施設情報を取得
		obj = map.forEachFeatureAtPixel(
			evt.pixel,
			function(feature, layer) {
				return {feature: feature, layer: layer};
			}
		);

		var feature = null;
		var layer   = null;
		if(obj !== undefined) {
			feature = obj.feature;
			layer   = obj.layer;
		}
		// クリックした場所に要素がなんにもない場合、クリック位置に地図の移動を行う
		if (feature === null) {
			coord = map.getCoordinateFromPixel(evt.pixel);
			view = map.getView();
			papamamap.animatedMove(coord[0], coord[1], false);
			view.setCenter(coord);
		}

		// クリックした場所に既に描いた同心円がある場合、円を消す
		if (feature && layer.get('name') === 'layerCircle' &&
			feature.getGeometry().getType() === "Polygon") {
			$('#cbDisplayCircle').attr('checked', false).checkboxradio('refresh');
			clearCenterCircle();
		}

		// クリックした場所に保育施設がある場合、ポップアップダイアログを出力する
		if (feature && "Point" == feature.getGeometry().getType()) {
			var type = feature.get('種別') ? feature.get('種別') :  feature.get('Type');
			if(type === undefined) {
				return;
			}
			var geometry = feature.getGeometry();
			var coord = geometry.getCoordinates();
			popup.setPosition(coord);

			// タイトル部
			var title = papamamap.getPopupTitle(feature);
			$("#popup-title").html(title);

			// 内容部
			papamamap.animatedMove(coord[0], coord[1], false);
			var content = papamamap.getPopupContent(feature);
			$("#popup-content").html(content);
			$('#popup').show();
			view = map.getView();
			view.setCenter(coord);
			window.alert('⑤');

		}
	});

	// 中心座標変更セレクトボックス操作イベント定義
	$('#moveTo').change(function(){
		// $('#markerTitle').hide();
		// $('#marker').hide();

		// 指定した最寄り駅に移動
		papamamap.moveToSelectItem(moveToList[$(this).val()]);

		// 地図上にマーカーを設定する
		var lon = moveToList[$(this).val()].lon;
		var lat = moveToList[$(this).val()].lat;
		var label = moveToList[$(this).val()].name;
		var pos = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
		// Vienna marker
		drawMarker(pos, label);
	});

	// 半径セレクトボックスのイベント定義
	$('#changeCircleRadius').change(function(evt){
		radius = $(this).val();
		if(radius === "") {
			clearCenterCircle();
			$('#cbDisplayCircle').prop('checked', false).checkboxradio('refresh');
			return;
		} else {
			$('#cbDisplayCircle').prop('checked', true).checkboxradio('refresh');
			drawCenterCircle(radius);
		}
	});

	// 円表示ボタンのイベント定義
	$('#cbDisplayCircle').click(function(evt) {
		radius = $('#changeCircleRadius').val();
		if($('#cbDisplayCircle').prop('checked')) {
			drawCenterCircle(radius);
		} else {
			clearCenterCircle();
		}
	});

	// 地図変更選択ボックス操作時のイベント
	$('#changeBaseMap').change(function(evt) {
		if($(this).val() === "背景") {
			$(this).val($(this).prop("selectedIndex", 1).val());
		}
		papamamap.changeMapServer(
			mapServerList[$(this).val()], $('#changeOpacity option:selected').val()
			);
	});

	// ポップアップを閉じるイベント
	$('#popup-closer').click(function(evt){
		$('#popup').hide();
		return;
	});

	// ポップアップを閉じる
	$('.ol-popup').parent('div').click(function(evt){
		$('#popup').hide();
		return;
	});

	// 親要素へのイベント伝播を停止する
	$('.ol-popup').click(function(evt){
		evt.stopPropagation();
	});



	/**
	 * レイヤー状態を切り替える
	 *
	 * @param  {[type]} checkObj [description]
	 * @return {[type]}               [description]
	 */
	function updateLayerStatus(checkObj)
	{
		papamamap.switchLayer($('#cbNinka').prop('id'), checkObj.ninka);
		papamamap.switchLayer($('#cbNinkagai').prop('id'), checkObj.ninkagai);
		papamamap.switchLayer($('#cbKindergarten').prop('id'), checkObj.kindergarten);
		$('#cbNinka').prop('checked', checkObj.ninka).checkboxradio('refresh');
		$('#cbNinkagai').prop('checked', checkObj.ninkagai).checkboxradio('refresh');
		$('#cbKindergarten').prop('checked', checkObj.kindergarten).checkboxradio('refresh');
	}

	/**
	 * 円を描画する 関数内関数
	 *
	 * @param  {[type]} radius    [description]
	 * @return {[type]}           [description]
	 */
	function drawCenterCircle(radius)
	{
		if($('#cbDisplayCircle').prop('checked')) {
			papamamap.drawCenterCircle(radius);

			$('#center_markerTitle').hide();
			$('#center_marker').hide();

			var center = map.getView().getCenter();
			var coordinate = center;
			var marker = new ol.Overlay({
				position: coordinate,
				positioning: 'center-center',
				element: $('#center_marker'),
				stopEvent: false
			});
			map.addOverlay(marker);

			// 地図マーカーラベル設定
			$('#center_markerTitle').html("");
			var markerTitle = new ol.Overlay({
				position: coordinate,
				element: $('#center_markerTitle')
			});
			map.addOverlay(markerTitle);
			$('#center_markerTitle').show();
			$('#center_marker').show();
		}
	}

	/**
	 * 円を消す
	 *
	 * @return {[type]} [description]
	 */
	function clearCenterCircle()
	{
		papamamap.clearCenterCircle();
		$('#center_markerTitle').hide();
		$('#center_marker').hide();
		$('#changeCircleRadius').val('').selectmenu('refresh');
		return;
	}

	/**
	 * 指定座標にマーカーを設定する
	 * @param  {[type]} coordinate [description]
	 * @return {[type]}            [description]
	 */
	function drawMarker(coordinate, label)
	{
		$('#markerTitle').hide();
		$('#marker').hide();
		var marker = new ol.Overlay({
			position: coordinate,
			positioning: 'center-center',
			element: $('#marker'),
			stopEvent: false
		});
		map.addOverlay(marker);

		// 地図マーカーラベル設定
		$('#markerTitle').html(label);
		var markerTitle = new ol.Overlay({
			position: coordinate,
			element: $('#markerTitle')
		});
		map.addOverlay(markerTitle);
		$('#markerTitle').show();
		$('#marker').show();
		return;
	}

});
