/**
 * 認可保育所向けスタイル
 * @param  {[type]} feature    [description]
 * @param  {[type]} resolution [description]
 * @return {[type]}            [description]
 */
var ninkaStyleFunction = function(feature, resolution)
{
	var style = [];

	style = nurseryStyleFunction(feature, resolution, { color: 'rgba(153, 153, 153, 1)', img: 'image/school.png'});
	return style;
};


/**
 * 保育施設共通のスタイル定義
 * @param  {[type]} feature      [description]
 * @param  {[type]} resolution   [description]
 * @param  {[type]} featureStyle [description]
 * @return {[type]}              [description]
 */
var nurseryStyleFunction = function(feature, resolution, featureStyle) {
	var radius = 15;
	var background = new ol.style.Circle({
		radius: radius,
		fill: new ol.style.Fill({
			color: featureStyle.color
		}),
		stroke: new ol.style.Stroke({color: 'white', width: 3})
	});
	var image = new ol.style.Icon({
		anchor: [0.5, 0.5],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: featureStyle.img,
		scale: 0.5
	});

	resolution = Math.floor(resolution * 1000);
	var _type = "";
	var label = feature.get('ラベル') ? feature.get('ラベル') : feature.get('Label')
	var text = resolution < 10000 ? label : '';
	var style = [];
	style = [
		new ol.style.Style({image: background}),
		new ol.style.Style({image: image}),
	];

	if (text !== "") {
		style.push(
			new ol.style.Style({
				text: new ol.style.Text({
					offsetY: -20.0,
					text: text,
					font: '14px sans-serif',
					fill: new ol.style.Fill({
						color: '#000'
					}),
					stroke: new ol.style.Stroke({
						color: '#FFF',
						width: 3
					})
				})
			})
		);
	}
	return style;
};



// 距離計測用同心円の色設定
var circleStyleFunction = function(feature, resolution) {
	resolution = Math.floor(resolution * 1000);
	var text = "";
	if(feature.get('name') !== null) {
		text = resolution < 100000 ? feature.get('name') : '';
	}
	var style = [new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'rgba(238, 149, 44, 0.30)',
			width: 3
		}),
		fill: new ol.style.Fill({
			color: 'rgba(238, 149, 44, 0.30)'
		}),
		text: new ol.style.Text({
			offsetY: -40.0,
			text: text,
			font: '20px sans-serif',
			fill: new ol.style.Fill({
				color: 'rgba(255, 0, 0, 0.4)'
			}),
			stroke: new ol.style.Stroke({
				color: '#FFF',
				width: 3
			})
		})
	})];
	return style;
};
