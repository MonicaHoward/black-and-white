fragsFx.prototype.options = {
	// Number of frags.
	frags: 25,
	// The boundaries of the frag translation (pixel values).
	boundaries: {x1: 100, x2: 100, y1: 50, y2: 50},
	// The area of the frags in percentage values (clip-path).
	// We can also use random values by setting options.area to "random".
	area: 'random',
	/* example with 4 frags (percentage values)
	[{top: 80, left: 10, width: 3, height: 20},{top: 2, left: 2, width: 4, height: 40},{top: 30, left: 60, width: 3, height: 60},{top: 10, left: 20, width: 50, height: 6}]
	*/
	// If using area:"random", we can define the area´s minimum and maximum values for the clip-path. (percentage values)
	randomIntervals: {
		top: {min: 0,max: 90},
		left: {min: 0,max: 90},
		// Either the width or the height will be selected with a fixed value (+- 0.1) for the other dimension (percentage values).
		dimension: {
			width: {min: 10,max: 60, fixedHeight: 1.1},
			height: {min: 10,max: 60, fixedWidth: 1.1}
		}
	},
	parallax: false,
	// Range of movement for the parallax effect (pixel values).
	randomParallax: {min: 10, max: 150}
};

fragsFx.prototype._init = function() {
	// The dimensions of the main element.
	this.dimensions = {width: this.el.offsetWidth, height: this.el.offsetHeight};
	// The source of the main image.
	this.imgsrc = this.el.style.backgroundImage.replace('url(','').replace(')','').replace(/\"/gi, "");;
	// Render all the frags defined in the options.
	this._layout();
	// Init/Bind events
	this._initEvents();
};

fragsFx.prototype._layout = function() {
	// Create the frags and add them to the DOM (append it to the main element).
	this.frags = [];
	for (var i = 0, len = this.options.frags; i < len; ++i) {
		const frag = this._createfrag(i);
		this.frags.push(frag);
	}
};

fragsFx.prototype._createfrag = function(pos) {
	var frag = document.createElement('div');
	frag.className = 'frag';
	// Set up a random number for the translation of the frag when using parallax (mousemove).
	if( this.options.parallax ) {
		frag.setAttribute('data-parallax', getRandom(this.options.randomParallax.min,this.options.randomParallax.max));
	}
	// Create the frag "piece" on which we define the clip-path configuration and the background image.
	var piece = document.createElement('div');
	piece.style.backgroundImage = 'url(' + this.imgsrc + ')';
	piece.className = 'frag__piece';
	piece.style.backgroundImage = 'url(' + this.imgsrc + ')';
	this._positionfrag(pos, piece);
	frag.appendChild(piece);
	this.el.appendChild(frag);

	return frag;
};

fragsFx.prototype._positionfrag = function(pos, piece) {
	const isRandom = this.options.area === 'random',
		  data = this.options.area[pos],
		  top = isRandom ? getRandom(this.options.randomIntervals.top.min,this.options.randomIntervals.top.max) : data.top,
		  left = isRandom ? getRandom(this.options.randomIntervals.left.min,this.options.randomIntervals.left.max) : data.left;

	// Select either the width or the height with a fixed value for the other dimension.
	var width, height;

	if( isRandom ) {
		if(!!Math.round(getRandom(0,1))) {
			width = getRandom(this.options.randomIntervals.dimension.width.min,this.options.randomIntervals.dimension.width.max);
			height = getRandom(Math.max(this.options.randomIntervals.dimension.width.fixedHeight-0.1,0.1), this.options.randomIntervals.dimension.width.fixedHeight+0.1);
		}
		else {
			height = getRandom(this.options.randomIntervals.dimension.width.min,this.options.randomIntervals.dimension.width.max);
			width = getRandom(Math.max(this.options.randomIntervals.dimension.height.fixedWidth-0.1,0.1), this.options.randomIntervals.dimension.height.fixedWidth+0.1);
		}
	}
	else {
		width = data.width;
		height = data.height;
	}

	if( !isClipPathSupported ) {
		const clipTop = top/100 * this.dimensions.height,
			  clipLeft = left/100 * this.dimensions.width,
			  clipRight = width/100 * this.dimensions.width + clipLeft,
			  clipBottom = height/100 * this.dimensions.height + clipTop;

		piece.style.clip = 'rect(' + clipTop + 'px,' + clipRight + 'px,' + clipBottom + 'px,' + clipLeft + 'px)';
	}
	else {
		piece.style.WebkitClipPath = piece.style.clipPath = 'polygon(' + left + '% ' + top + '%, ' + (left + width) + '% ' + top + '%, ' + (left + width) + '% ' + (top + height) + '%, ' + left + '% ' + (top + height) + '%)';
	}

	// Translate the piece.
	// The translation has to respect the boundaries defined in the options.
	const translation = {
			x: getRandom(-1 * left/100 * this.dimensions.width - this.options.boundaries.x1, this.dimensions.width - left/100 * this.dimensions.width + this.options.boundaries.x2 - width/100 * this.dimensions.width),
			y: getRandom(-1 * top/100 * this.dimensions.height - this.options.boundaries.y1, this.dimensions.height - top/100 * this.dimensions.height + this.options.boundaries.y2 - height/100 * this.dimensions.height)
		  };

	piece.style.WebkitTransform = piece.style.transform = 'translate3d(' + translation.x + 'px,' + translation.y +'px,0)';
};

fragsFx.prototype._initEvents = function() {
	const self = this;

	// Parallax movement.
	if( this.options.parallax ) {
		this.mousemoveFn = function(ev) {
			requestAnimationFrame(function() {
				// Mouse position relative to the document.
				const mousepos = getMousePos(ev),
					// Document scrolls.
					docScrolls = {left : document.body.scrollLeft + document.documentElement.scrollLeft, top : document.body.scrollTop + document.documentElement.scrollTop},
					bounds = self.el.getBoundingClientRect(),
					// Mouse position relative to the main element (this.el).
					relmousepos = { x : mousepos.x - bounds.left - docScrolls.left, y : mousepos.y - bounds.top - docScrolls.top };

				// Movement settings for the animatable elements.
				for(var i = 0, len = self.frags.length; i <= len-1; ++i) {
					const frag = self.frags[i],
						t = frag.getAttribute('data-parallax'),
						transX = t/(self.dimensions.width)*relmousepos.x - t/2,
						transY = t/(self.dimensions.height)*relmousepos.y - t/2;

						frag.style.transform = frag.style.WebkitTransform = 'translate3d(' + transX + 'px,' + transY + 'px,0)';
				}
			});
		};
		this.el.addEventListener('mousemove', this.mousemoveFn);

		this.mouseleaveFn = function(ev) {
			requestAnimationFrame(function() {
				// Movement settings for the animatable elements.
				for(var i = 0, len = self.frags.length; i <= len-1; ++i) {
					const frag = self.frags[i];
					frag.style.transform = frag.style.WebkitTransform = 'translate3d(0,0,0)';
				}
			});
		};
		this.el.addEventListener('mouseleave', this.mouseleaveFn);
	}

	// Window resize - Recalculate clip values and translations.
	this.debounceResize = debounce(function(ev) {
		// total elements/configuration
		const areasTotal = self.options.area.length;
		// Recalculate dimensions.
		self.dimensions = {width: self.el.offsetWidth, height: self.el.offsetHeight};
		// recalculate the clip/clip-path and translations
		for(var i = 0, len = self.frags.length; i <= len-1; ++i) {
			self._positionfrag(i, self.frags[i].querySelector('.frag__piece'));
		}
	}, 10);
	window.addEventListener('resize', this.debounceResize);
};
