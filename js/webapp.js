(function() {
	'use strict'
	// 数据存储部分

	var Util = (function() {
		// localStorage共享一个域，为避免冲突，给每个Key加上前缀
		var prefix = 'fiction_reader_';
		var StorageGetter = function(key) {
			return localStorage.getItem(prefix + key);
		}
		var StorageSetter = function(key, value) {
			return localStorage.setItem(prefix + key, value);
		}

		var getJSONP = function(url, callbackFun) {
			$.jsonp({
				url: url,
				cache: true,
				callback: 'duokan_fiction_chapter',
				success: function(json) {
					var decodeJson = $.base64.decode(json);
					callbackFun(decodeJson);
					// debugger;
				}
			});
		}

		// 事件委托的函数
		var addHandler = function(element, type, handler) {
			
			if (element.addEventListener) {  // addEventListener 监听(火狐及其他浏览器)
				element.addEventListener(type, handler, false);
			} else if (element.attachEvent) { // attachEvent 监听 (IE)
				element.attachEvent('on' + type, handler); // 
			} else {
				element['on' + type] = handler;
			}
		};

		var getEvent = function(event) {
			return event ? event : window.event;
		}

		var getTarget = function(event) {
			// event.srcElement 可以捕获当前事件作用的对象
			// IE下,event 对象有srcElement属性,但是没有target属性;
			// Firefox下,event对象有target属性,但是没有srcElement属性.但他们的作用是相当的
			return event.target || event.srcElement;
		}

		var changeBkColor = function(BkColor) {
			initBkColor = BkColor;
			Dom.fiction_area.css('background-color', initBkColor);
			Util.StorageSetter('background-color', initBkColor);
		}

		var changeBkClass = function(target_id) {
			Dom.color1_bk.removeClass('icon-color-current');
			Dom.color2_bk.removeClass('icon-color-current');
			Dom.color3_bk.removeClass('icon-color-current');
			Dom.color4_bk.removeClass('icon-color-current');
			Dom.color5_bk.removeClass('icon-color-current');

			$('.' + target_id + '-bk').addClass('icon-color-current');
		}

		return {
			getJSONP: getJSONP,
			addHandler: addHandler,
			getEvent: getEvent,
			getTarget: getTarget,
			changeBkColor: changeBkColor,
			changeBkClass: changeBkClass,
			StorageSetter: StorageSetter,
			StorageGetter: StorageGetter
		}
	})();

	var Dom = {
		top_nav: $('#nav_bar'),
		bottom_nav: $('.foot-nav'),
		font_button: $('.m-font-bar'),
		pannel_control: $('.pannel-control'),
		night_day: $('.night-day'),
		light_day: $('.light-day'),
		fiction_area: $('#fiction_container'),
		fiction_word: $('#fiction_word'),
		color1_bk: $('.color1-bk'),
		color2_bk: $('.color2-bk'),
		color3_bk: $('.color3-bk'),
		color4_bk: $('.color4-bk'),
		color5_bk: $('.color5-bk')
	};

	var readerModel;
	var readerBaseFrame;

	var Win = $(window);
	var Doc = $(document);
	var initFontSize = Util.StorageGetter('font-size');
	initFontSize = parseInt(initFontSize);
	if (!initFontSize) {
		initFontSize = 14;
	}
	Dom.fiction_area.css('font-size', initFontSize);

	var initBkColor = Util.StorageGetter('background-color');
	if (!initBkColor) {
		initBkColor = '#f7eee5';
	}
	Dom.fiction_area.css('background-color', initBkColor);

	var Chapter_length;
	var Chapter_id;

	function main() {
		// todo 整个项目的入口函数
		EventHandler();
		readerModel = ReaderModel();
		readerBaseFrame = ReaderBaseFrame(Dom.fiction_word);

		readerModel.init(function(data) {
			readerBaseFrame(data);
		});

	}

	function ReaderModel() {
		// TODO 获取数据

		var init = function(callbackFun) {
			// debugger;
			getFictionInfo(function(data) {
				getSingleChapterInfo(data, callbackFun);
			});
		}

		var getFictionInfo = function(callback) {
			$.get('data/chapter.json', function(data) {
				// TODO
				Chapter_length = data.chapters.length;
				// 
				if (Util.StorageGetter('chapter_id') == null) {
					Chapter_id = parseInt(data.chapters[0].chapter_id + 1);
				} else {
					Chapter_id = parseInt(Util.StorageGetter('chapter_id'));
				}
				// debugger;
				callback && callback(Chapter_id);
			}, 'json');
		}

		var getSingleChapterInfo = function(chapter_id, callbackFun) {
			$.get('data/data' + chapter_id + '.json', function(data) {
				//todo	
				var url = data.jsonp;
				Util.getJSONP(url, callbackFun);
				// debugger;
			}, 'json');
		}

		var gotoChapter = function() {
			getSingleChapterInfo(Chapter_id, function(data) {
				// debugger;
				readerBaseFrame(data);
			});
		}

		var getPreChapter = function() {
			if (Chapter_id <= 1) {
				return;
			}
			Chapter_id -= 1;
			// debugger;
			Util.StorageSetter('chapter_id', Chapter_id);
			gotoChapter();
			$(window).scrollTop(0);
		}

		var getNextChapter = function() {
			// 由于只有4个data.json文件，所以这里写死
			if (Chapter_id >= 4) {
				// if(Chapter_id >= Chapter_length + 1){
				return;
			}
			Chapter_id += 1;
			// debugger;
			Util.StorageSetter('chapter_id', Chapter_id);
			gotoChapter();
			$(window).scrollTop(0);
		}

		return {
			init: init,
			gotoChapter: gotoChapter,
			getPreChapter: getPreChapter,
			getNextChapter: getNextChapter,
			getFictionInfo: getFictionInfo,
			getSingleChapterInfo: getSingleChapterInfo
		};
	}

	function ReaderBaseFrame(container) {
		// TODO 渲染基本的UI结构
		function parseChapterData(data) {
			var jsonObj = JSON.parse(data);
			var html = '<h4>' + jsonObj.t + '</h4>';
			for (var i = 0; i < jsonObj.p.length; i++) {
				html += '<p>' + jsonObj.p[i] + '</p>';
			}
			return html;
		}
		return function(data) {
			container.html(parseChapterData(data));
		}

	}

	function EventHandler() {
		// todo 交互事件的绑定
		// 上下翻页
		$('#prev_page').click(function() {
			console.log('you clicked the prev page.');
			readerModel.getPreChapter();
		});

		$('#next_page').click(function() {
			console.log('you clicked the next page.');
			readerModel.getNextChapter();
		});

		// 点击屏幕中间区域，上下边栏出现或消失
		$('#action_mid').click(function() {
			console.log("you clicked the screen");
			if (Dom.top_nav.css('display') == 'none') {
				Dom.top_nav.show();
				Dom.bottom_nav.show();
			} else {
				Dom.top_nav.hide();
				Dom.bottom_nav.hide();
				Dom.pannel_control.hide();
			}
			Dom.font_button.removeClass('current');
		});

		// 滚动页面，上下边栏消失，控制面板消失
		Win.scroll(function() {
			console.log('you scrolled the screen.');
			Dom.top_nav.hide();
			Dom.bottom_nav.hide();
			Dom.pannel_control.hide();
			Dom.font_button.removeClass('current');
		});

		// 点击字体，控制面板出现或隐藏
		Dom.font_button.click(function() {
			console.log("You clicked the font button.");
			if (Dom.pannel_control.css('display') == 'none') {
				Dom.pannel_control.show();
				Dom.font_button.addClass('current');
			} else {
				Dom.pannel_control.hide();
				Dom.font_button.removeClass('current');
			}
		});

		// 点击白天或夜晚，模式切换
		Dom.night_day.click(function() {
			console.log('you clicked the night day');
			Dom.night_day.hide();
			Dom.light_day.show();
			initBkColor = '#283548';
			Dom.fiction_area.css('background-color', initBkColor)
			Util.StorageSetter('background-color', initBkColor);
			Dom.font_button.removeClass('current');

		});

		Dom.light_day.click(function() {
			console.log('you clicked the light day');
			Dom.light_day.hide();
			Dom.night_day.show();

			initBkColor = '#f7eee5';
			Dom.fiction_area.css('background-color', initBkColor)
			Util.StorageSetter('background-color', initBkColor);
			Dom.font_button.removeClass('current');
		});

		// 放大或缩小字体
		$('#big_font').click(function() {
			console.log('you clicked the bigger font');
			if (initFontSize > 20) {
				return;
			}
			initFontSize += 1;
			Dom.fiction_area.css('font-size', initFontSize);
			Util.StorageSetter('font-size', initFontSize);
		});

		$('#small_font').click(function() {
			console.log('you clicked the smaller font.');
			if (initFontSize < 10) {
				return;
			}
			initFontSize -= 1;
			Dom.fiction_area.css('font-size', initFontSize);
			Util.StorageSetter('font-size', initFontSize);
		});

		// 设置背景色
		// 使用事件委托的方式
		Util.addHandler($('.color-pannel')[0], 'click', function(event) {
			var event = Util.getEvent(event);
			// debugger;
			var target = Util.getTarget(event);

			switch (target.id) {
				case 'color1':
					Util.changeBkColor('#f7eee5');
					Util.changeBkClass(target.id);
					break;
				case 'color2':
					Util.changeBkColor('#e9dfc7');
					Util.changeBkClass(target.id);
					break;
				case 'color3':
					Util.changeBkColor('#a4a4a4');
					Util.changeBkClass(target.id);
					break;
				case 'color4':
					Util.changeBkColor('#cdefce');
					Util.changeBkClass(target.id);
					break;
				case 'color5':
					Util.changeBkColor('#283548');
					Util.changeBkClass(target.id);
					break;
				default:
					break;
			}
		});

	}

	main();
})();