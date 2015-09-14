//elem: element the animation will be applied to. [necessary
//property: property which would be animated of the element. [necessary
//termini: property would be changed to. [necessary
//duration: a string or number determining how long the animation will run. [optional
//easingFunc: a function that describes the value of a property given a percentage of completeness,
//            type: function or string ['easeInOut', 'easeIn', 'easeOut', 'linear'
//            default: easeInOut [.5, 0, .5, 1]
//            [optional
//steps: a string or number determining the number of times the animation will take [optional
//animate函数会在body元素末尾添加一个div元素，大部分情况下你不需要担心，这个div的margin,border,padding,width,height都已设为0px，但是在使用诸如:nth-child的CSS选择器和诸如htmlElement.childNodes[num]的js语句时需要留意这一点。

var animate; //animate是一个函数
(function(){
	var heap = []; //用于记录正在进行的动画
	heap.num = 0; //记录已经执行的动画数，在数目为零时整理堆
	var rent,
		borrow,
		i,
		j;
	var toString = {}.toString;
	var supportType = {
		//background: '',
		backgroundColor: '',
		//backgroundPosition: '',
		//backgroundPositionX: '',
		//backgroundPositionY: '',
		//backgroundSize: '',
		//border: '',
		//borderBottom: '',
		borderBottomColor: '',
		//borderBottomLeftRadius: '',
		//borderBottomRightRadius: '',
		borderBottomWidth: '',
		//borderColor: '',
		//borderLeft: '',
		borderLeftColor: '',
		borderLeftWidth: '',
		//borderRadius: '',
		//borderRight: '',
		//borderRightColor: '',
		borderRightWidth: '',
		//borderTop: '',
		borderTopColor: '',
		//borderTopLeftRadius: '',
		//borderTopRightRadius: '',
		borderTopWidth: '',
		//borderWidth: '',
		bottom: '',
		//boxShadow: '',
		color: '',
		fontSize: '',
		height: '',
		left: '',
		//lineHeight: '',
		//margin: '',
		marginBottom: '',
		marginLeft: '',
		marginRight: '',
		marginTop: '',
		maxHeight: '',
		maxWidth: '',
		minHeight: '',
		minWidth: '',
		opacity: '',
		//outline: '',
		outlineColor: '',
		outlineOffset: '',
		outlineWidth: '',
		//padding: '',
		paddingBottom: '',
		paddingLeft: '',
		paddingRight: '',
		paddingTop: '',
		perspective: '',
		//perspectiveOrigin: '',
		right: '',
		//textShadow: '',
		//textTransform: '',
		top: '',
		//transform: '',
		//transformOrigin: '',
		width: '',
	};
	animate = function(elem, property, termini, duration, easingFunc, callback, callbackDelay, callbackArgs, steps, delay){
		//当动画堆的length属性值过大且没有正在进行的动画时，对其赋0值
		heap.length > 100 && heap.num === 0 && ( heap.length = 0 );
		//如果正在进行的动画过多，则不再接受动画请求
		if( heap.length > 200 ){
			console.warn('正在运行的动画过多，您的动画请求被拒绝，您可以稍后重试。[本消息来自animate.js] (To many animation now! The \'animate()\' function has rejected the animation apply. Please do it later.[Message from animate.js]');
			return false;
		}
		
		//对参数合法性进行检测
		if( !elem || elem.nodeType !== 1 ){
			console.warn('传入的"element"参数不合法，不可以对其进行动画操作。[本消息来自animate.js] (Illegal argument for "element". Can not apply animation to it.[Message from animate.js]');
			return false;
		}
		if( typeof property !== 'string' && toString.call(property) !== '[object String]'){
			console.warn('"property"参数必须是一个字符串或字符串对象。[本消息来自animate.js] (Illegal argument for "property".[Message from animate.js]');
			return false;
		}
		if( !(termini = animate.getStanForm( property, termini )) ){
			console.warn('"property"或"termini"的参数不合法。[本消息来自animate.js] (Illegal argument for "property" or "termini".[Message from animate.js]');
			console.log(termini);
			return false;
		}
		
		var origin,
			originAdj,
			change,
			whichSign = -1; //记录动画的在堆中的位置
		origin = getComputedStyle(elem)[property] || getComputedStyle(elem)['-webkit-' + property] || getComputedStyle(elem)['-moz-' + property] || getComputedStyle(elem)['-ms-' + property] || getComputedStyle(elem)['-o-' + property];
		if( origin === termini ){
			return false;
		}
		for( i in heap ){
			if( heap[i].elem === elem && heap[i].property === property ){
				whichSign = i;
				break;
			}
		}
		whichSign === -1 && ( whichSign = heap.length );
		
		//确定动画需要改变的样式类型。得到初始值、改变值，把最终值（目标值）转换为标准形式
		if( /^[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)px$/.test(termini) ){
		//长度变化
			pxFlag = true;
			originAdj = parseFloat( origin ) || 0;
			change = parseFloat( termini ) - originAdj;
		} else if( /^[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)$/.test(termini) ){
		//纯数字变化
			numFlag = true;
			originAdj = +origin;
			change = termini - originAdj;
		} else if( /^rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (?:0(?:\.\d+|)|1)\)$|^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/.test(termini) ){
		//颜色变化
			termini[3] === 'a' ? alphaSign = 4 : alphaSign = 3;
			originAdj = origin.match( /(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/g );
			rent = termini.match( /(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/g );
			change = [];
			for( i = 0; i < alphaSign; i++ ){
				originAdj[i] = +originAdj[i] || 1;
				change[i] = rent[i] - originAdj[i];
			}
		} else if( property.match('transform') ){
			termini = animate.getStanForm( 'transform', termini );
			termini[0] === 'p' && (
				borrow = termini.split('S'),
				property = borrow[0].slice(3) + property,
				termini = borrow[1]
			);
			termini[6] === '(' 
				? transformSign = 2
				: transformSign = 3;
			origin === 'none' && ( transformSign === 2 
				? origin = 'matrix(1, 0, 0, 1, 0, 0)' 
				: origin = 'matrix(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)' );
			originAdj = origin.match( /-?\d+\.?\d*(?!d)/g );
			rent = termini.match( /-?\d+\.?\d*(?!d)/g );
			change = [];
			for( i = 0; i < 10*transformSign-14; i++ ){
				originAdj[i] = +originAdj[i];
				change[i] = rent[i] - originAdj[i];
			}
		} else{
			console.warn('对不起，暂不支持此类型动画。(Sorry, the type of animation is not supported now. ');
			return false;
		}
		
		//确定动画时间间隔，延迟，步数等
		( !duration && (duration = 400) ) ||
		( duration === 'slow' && (duration = 800) ) ||
		( duration === 'fast' && (duration = 200) ) ||
		( duration === 'normal' && (duration = 400) );
		delay = delay || 0;
		steps = steps || Math.floor( (4*duration + change) / 37) || Math.floor( (4*duration + ( change[0] + change[1] + change[2] + (change[3] || 0) ) /4 ) / 80);
		
		var t = 0,
			stepTime = duration / steps,
			stepPercent = 1 / steps,
			x1, y1, x2, y2;
		
		//确定缓动函数
		if( !easingFunc ){
				x1 = .5; y1 = 0; x2 = .5; y2 = 1; easingFunc = 0;
		}else if( typeof easingFunc === 'string' ){
			(
				easingFunc === 'easeIn' && (
					x1 = .5, y1 = 0, x2 = 1, y2 = 1
				)
			) || (
				easingFunc === 'easeOut' && (
					x1 = 0, y1 = 0, x2 = .5, y2 = 1
				)
			) || (
				easingFunc === 'easeInOut' && (
					x1 = .5, y1 = 0, x2 = .5, y2 = 1
				)
			) || (
				easingFunc === 'linear' && (
					easingFunc = function( t ){
						return t;
					},
					easingFunc.flag = true //flag设置为true，表示缓动函数已经就绪
				)
			);
		}else if( Array.isArray( easingFunc ) ){
				x1 = easingFunc[0]; y1 = easingFunc[1]; x2 = easingFunc[2]; y2 = easingFunc[3];
		}else if( typeof easingFunc === 'function' ){
				easingFunc.flag = true;
		} 
		
		if( !easingFunc.flag ){
			easingFunc = function(t){
				return animate.yFromXCubicBezier(t, x1, y1, x2, y2);
			};
		}
		
		//执行动画的函数
		var timer = function(){
			var tick;
			var end = function(){
				clearInterval( tick );
				elem.style[property] = termini;
				delete heap[whichSign];
				heap.num--;
				if( typeof callback === 'function' ){
					!callbackDelay 
						? callback.apply( this, callbackArgs )
						: setTimeout(
							function(){
								callback.apply( this, callbackArgs );
							},
							callbackDelay
						);
				}
			};
			
			whichSign === heap.length ? (
				heap[whichSign] = {
					'elem': elem,
					'property': property,
					'origin': origin
				},
				heap.num++
			) : (
				clearInterval( heap[whichSign].tick ),
				heap[whichSign].origin = origin
			);
			if( pxFlag ){
				heap[whichSign].tick = tick = setInterval(function(){
					t += stepPercent;
					elem.style[property] = easingFunc(t)*change + originAdj + 'px';
					t > 1 && end();
				}, stepTime);
			}else if( numFlag ){
				heap[whichSign].tick = tick = setInterval(function(){
					t += stepPercent;
					elem.style[property] = easingFunc(t)*change + originAdj;
					t > 1 &&  end();
				}, stepTime);
			}else if( alphaSign === 3 ){
				heap[whichSign].tick = tick = setInterval( (function(){
					var changePercent;
					return function(){
						t += stepPercent;
						changePercent = easingFunc(t);
						elem.style[property] = 'rgb(' + Math.floor( changePercent*change[0] + originAdj[0] ) + ',' + Math.floor( changePercent*change[1] + originAdj[1] ) + ',' + Math.floor( changePercent*change[2] + originAdj[2] ) + ')' ;
						t > 1 &&  end();
					};
				}()), stepTime);
			}else if( alphaSign === 4 ){
				heap[whichSign].tick = tick = setInterval( (function(){
					var changePercent;
					return function(){
						t += stepPercent;
						changePercent = easingFunc(t);
						elem.style[property] = 'rgba(' + Math.floor( changePercent*change[0] + originAdj[0] ) + ',' + Math.floor( changePercent*change[1] + originAdj[1] ) + ',' + Math.floor( changePercent*change[2] + originAdj[2] ) + ','  + Math.floor( (changePercent*change[3] + originAdj[3])*100 )/100 + ')' ;
						t > 1 &&  end();
					};
				}()), stepTime);
			}else if(transformSign === 2 || transformSign === 3){
				heap[whichSign].tick = tick = setInterval( (function(){
					var changePercent,
						str = s = '';
					transformSign === 2 ? s = 'matrix(' : s = 'matrix3d(';
					return function(){
						t += stepPercent;
						changePercent = easingFunc(t);
						str = s;
						for(i = 0; i < 10*transformSign-14; i++){
							str += ( changePercent*change[i] + originAdj[i] ).toFixed(3) + ', ';
						}
						elem.style[property] = str.slice(0, -2) + ')';
						console.log(str.slice(0, -2) + ')');
						t > 1 &&  end();
					};
				}()), stepTime);
			}
		};
		
		delay === 0 ? timer() : setTimeout(timer, delay);
		return true;
	}
	
	//取消动画函数
	animate.cancel = function( toOrigin, which ){
		//三个参数都是可选的
		//toOrigin: 布尔值，动画元素是否回到初始位置，默认为false
		//which: Number or String,取消第几个动画，默认为取消最后一个动画；如果值为'all'，取消全部
		var i;
		toOrigin = toOrigin || false;
		if( which === undefined ){
			for(i = heap.length - 1; i >= 0; i--){
				if( heap[i] ){
					clearInterval( heap[i].tick );
					toOrigin && ( heap[i].elem.style[ heap[i].property ] = heap[i].origin );
					delete heap[i];
					return true; //正确删除动画堆里的最后一个动画
				}
			}
			return false; //如果此时不存在动画，返回
		}
		if( which === 'all' ){
			for(i = heap.length - 1; i >= 0; i--){
				if( heap[i] ){
					clearInterval( heap[i].tick );
					toOrigin && ( heap[i].elem.style[ heap[i].property ] = heap[i].origin );
					delete heap[i];
				}
			}
			return true; //已全部取消，返回
		}
		if( !heap[which] ){
			return false;
		}
		clearInterval( heap[which].tick );
		toOrigin && ( heap[which].elem.style[ heap[which].property ] = heap[which].origin );
		delete heap[which];
	};
	
	animate.heap = heap;
}());


animate.yFromXCubicBezier = function(xTarget, x1, y1, x2, y2){
	var tolerance = 0.00001,
		t0 = 0.6,
		x = 3*(1-t0)*(1-t0)*t0*x1 + 3*(1-t0)*t0*t0*x2 + t0*t0*t0,
		t;
	while( Math.abs(x - xTarget) > tolerance ){
		t = t0 - ( 3*(1-t0)*(1-t0)*t0*x1 + 3*(1-t0)*t0*t0*x2 + t0*t0*t0 - xTarget ) / ( 3*(1 - t0)*(1 - t0)*x1 + 6*(1 - t0)*t0*(x2 - x1) + 3*t0*t0*(1 - x2) );
		t0 = t;
		x = 3*(1-t0)*(1-t0)*t0*x1 + 3*(1-t0)*t0*t0*x2 + t0*t0*t0;
	}
	return 3*(1-t)*(1-t)*t*y1 + 3*(1-t)*t*t*y2 + t*t*t;	
};
animate.getStanForm = (function(){
//获得标准形式的动画目标值描述
	var elem = document.createElement('div'),
		ret;
	elem.style.display = 'none';
	elem.style.width = '0px';
	elem.style.height = '0px';
	elem.style.margin = '0px';
	elem.style.border = '0px';
	elem.style.padding = '0px';
	elem.style.outlineWidth = '0px';
	document.body.appendChild(elem);
	return function( property, badForm ){
		if( getComputedStyle(elem)[property] !== undefined && elem.style[property] !== undefined ){
			elem.style[property] = badForm;
			return getComputedStyle(elem)[property];
		}else if( getComputedStyle(elem)['-webkit-' + property] !== undefined && elem.style['-webkit-' + property] !== undefined ){
			elem.style['-webkit-' + property] = badForm;
			return getComputedStyle(elem)['-webkit-' + property];
		}else if( getComputedStyle(elem)['-moz-' + property] !== undefined && elem.style['-moz-' + property] !== undefined ){
			elem.style['-moz-' + property] = badForm;
			return getComputedStyle(elem)['-moz-' + property];
		}else if( getComputedStyle(elem)['-ms-' + property] !== undefined && elem.style['-ms-' + property] !== undefined ){
			elem.style['-ms-' + property] = badForm;
			return getComputedStyle(elem)['-ms-' + property];
		}else if( getComputedStyle(elem)['-o-' + property] !== undefined && elem.style['-o-' + property] !== undefined ){
			elem.style['-o-' + property] = badForm;
			return getComputedStyle(elem)['-o-' + property];
		}
		return undefined;
	}
}());
