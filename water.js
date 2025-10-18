/**
 * Carga una configuración de WebGL que el navegador soporte.
 * Por ejemplo:
 * - no todos los navegadores soportan WebGL
 * - no todos soportan texturas de punto flotante
 * - no todos soportan filtrado lineal en texturas flotantes
 * - algunos sí permiten renderizado en texturas half-float
 */
document.addEventListener('click', () => {
  const video = document.getElementById('video-background');
  if (video && video.paused) {
    video.play().catch(e => console.warn('Reproducción bloqueada:', e));
  }
});

function loadConfig() {
  var canvas = document.createElement('canvas');
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    // El navegador no soporta WebGL
    return null;
  }

  // Cargar extensiones necesarias
  var extensions = {};
  [
    'OES_texture_float',
    'OES_texture_half_float',
    'OES_texture_float_linear',
    'OES_texture_half_float_linear'
  ].forEach(function(name) {
    var extension = gl.getExtension(name);
    if (extension) {
      extensions[name] = extension;
    }
  });

  // Si no hay soporte para texturas flotantes, salimos
  if (!extensions.OES_texture_float) {
    return null;
  }

  var configs = [];

  function crearConfig(tipo, glTipo, arrayTipo) {
    var nombre = 'OES_texture_' + tipo,
        nombreLinear = nombre + '_linear',
        soporteLineal = nombreLinear in extensions,
        extensionesConfig = [nombre];

    if (soporteLineal) {
      extensionesConfig.push(nombreLinear);
    }

    return {
      type: glTipo,
      arrayType: arrayTipo,
      linearSupport: soporteLineal,
      extensions: extensionesConfig
    };
  }

  // Configuración para texturas de punto flotante
  configs.push(
    crearConfig('float', gl.FLOAT, Float32Array)
  );

  // Configuración para half-float si está disponible
  if (extensions.OES_texture_half_float) {
    configs.push(
      crearConfig('half_float', extensions.OES_texture_half_float.HALF_FLOAT_OES, null)
    );
  }

  // Probar si se puede renderizar a cada tipo de textura
  var texture = gl.createTexture();
  var framebuffer = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  var config = null;

  for (var i = 0; i < configs.length; i++) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 32, 0, gl.RGBA, configs[i].type, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      config = configs[i];
      break;
    }
  }

  return config;
}

/**
 * Crea un bloque de píxeles transparentes para usar como textura vacía
 */
function createImageData(width, height) {
  try {
    return new ImageData(width, height);
  } catch (e) {
    // Fallback para IE
    var canvas = document.createElement('canvas');
    return canvas.getContext('2d').createImageData(width, height);
  }
}

/**
 * Traduce valores de background-position CSS a coordenadas porcentuales
 */
function translateBackgroundPosition(value) {
  var parts = value.split(' ');

  if (parts.length === 1) {
    switch (value) {
      case 'center': return ['50%', '50%'];
      case 'top': return ['50%', '0'];
      case 'bottom': return ['50%', '100%'];
      case 'left': return ['0', '50%'];
      case 'right': return ['100%', '50%'];
      default: return [value, '50%'];
    }
  } else {
    return parts.map(function(part) {
      switch (part) {
        case 'center': return '50%';
        case 'top':
        case 'left': return '0';
        case 'bottom':
        case 'right': return '100%';
        default: return part;
      }
    });
  }
}

/**
 * Compila shaders y crea un programa WebGL con sus ubicaciones de uniforms
 */
function createProgram(vertexSource, fragmentSource, uniformValues) {
  function compileSource(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Error de compilación: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  var program = {};
  program.id = gl.createProgram();
  gl.attachShader(program.id, compileSource(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program.id, compileSource(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program.id);
  if (!gl.getProgramParameter(program.id, gl.LINK_STATUS)) {
    throw new Error('Error de enlace: ' + gl.getProgramInfoLog(program.id));
  }

  // Extraer ubicaciones de uniforms
  program.uniforms = {};
  program.locations = {};
  gl.useProgram(program.id);
  gl.enableVertexAttribArray(0);
  var match, name, regex = /uniform (\w+) (\w+)/g, shaderCode = vertexSource + fragmentSource;
  while ((match = regex.exec(shaderCode)) != null) {
    name = match[2];
    program.locations[name] = gl.getUniformLocation(program.id, name);
  }

  return program;
}

/**
 * Asigna una textura a una unidad activa de WebGL
 */
function bindTexture(texture, unit) {
  gl.activeTexture(gl.TEXTURE0 + (unit || 0));
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

/**
 * Extrae la URL de una imagen CSS
 */
function extractUrl(value) {
  var urlMatch = /url\(["']?([^"']*)["']?\)/.exec(value);
  return urlMatch ? urlMatch[1] : null;
}

/**
 * Verifica si una URL es un data URI
 */
function isDataUri(url) {
  return url.match(/^data:/);
}

// Ejecutar configuración GL
var config = loadConfig();

// Crear textura transparente como fallback
var transparentPixels = createImageData(32, 32);

// Extiende el CSS para asegurar posicionamiento correcto
$('head').prepend('<style>.jquery-ripples { position: relative; z-index: 0; }</style>');
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 02 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFINICIÓN DE LA CLASE RIPPLES
var Ripples = function (el, options) {
	var that = this;

	this.$el = $(el);

	// Inicializar propiedades desde las opciones
	this.interactive = options.interactive;
	this.resolution = options.resolution;
	this.textureDelta = new Float32Array([1 / this.resolution, 1 / this.resolution]);

	this.perturbance = options.perturbance;
	this.dropRadius = options.dropRadius;

	this.crossOrigin = options.crossOrigin;
	this.imageUrl = options.imageUrl;

	// Inicializar canvas WebGL **********************************************************************
	var canvas = document.createElement('canvas');
	canvas.width = this.$el.innerWidth();
	canvas.height = this.$el.innerHeight();
	this.canvas = canvas;
	this.$canvas = $(canvas);
	this.$canvas.css({
		position: 'absolute',
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		zIndex: -1
	});

	this.$el.addClass('jquery-ripples').append(canvas);
	this.context = gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

	// Cargar extensiones necesarias
	config.extensions.forEach(function(name) {
		gl.getExtension(name);
	});

	// Redimensionar automáticamente si cambia el tamaño de la ventana
	this.updateSize = this.updateSize.bind(this);
	$(window).on('resize', this.updateSize);

	// Inicializar buffers de simulación de ondas
	this.textures = [];
	this.framebuffers = [];
	this.bufferWriteIndex = 0;
	this.bufferReadIndex = 1;

	var arrayType = config.arrayType;
	var textureData = arrayType ? new arrayType(this.resolution * this.resolution * 4) : null;

	for (var i = 0; i < 2; i++) {
		var texture = gl.createTexture();
		var framebuffer = gl.createFramebuffer();

		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, config.linearSupport ? gl.LINEAR : gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, config.linearSupport ? gl.LINEAR : gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.resolution, this.resolution, 0, gl.RGBA, config.type, textureData);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

		this.textures.push(texture);
		this.framebuffers.push(framebuffer);
	}

	// Inicializar geometría del quad
	this.quad = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		-1, -1,
		+1, -1,
		+1, +1,
		-1, +1
	]), gl.STATIC_DRAW);

	this.initShaders();
	this.initTexture(); // ← Aquí luego se reemplazará por loadVideoTexture si se desea
	this.setTransparentTexture();

	// Cargar imagen desde opciones o reglas CSS (se reemplazará por video más adelante)
	this.loadVideoTexture();

	// Establecer color de limpieza y modo de mezcla (alpha blending)
	gl.clearColor(0, 0, 0, 0);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	// El plugin ha sido inicializado correctamente
	this.visible = true;
	this.running = true;
	this.inited = true;
	this.destroyed = false;

	this.setupPointerEvents();

	// Iniciar animación
	function step() {
		if (!that.destroyed) {
			that.step();
			requestAnimationFrame(step);
		}
	}

	requestAnimationFrame(step);
};

// Configuración por defecto
Ripples.DEFAULTS = {
	imageUrl: null,
	resolution: 256,
	dropRadius: 20,
	perturbance: 0.03,
	interactive: true,
	crossOrigin: ''
};

// Métodos del prototipo
Ripples.prototype = {

	// Configurar eventos de puntero (mouse + touch)
	setupPointerEvents: function() {
		var that = this;

		function pointerEventsEnabled() {
			return that.visible && that.running && that.interactive;
		}

		function dropAtPointer(pointer, big) {
			if (pointerEventsEnabled()) {
				that.dropAtPointer(
					pointer,
					that.dropRadius * (big ? 1.5 : 1),
					(big ? 0.14 : 0.01)
				);
			}
		}

		// Escuchar eventos de puntero
		this.$el
			// Ondas pequeñas en movimiento del mouse o toque
			.on('mousemove.ripples', function(e) {
				dropAtPointer(e);
			})
			.on('touchmove.ripples touchstart.ripples', function(e) {
				var touches = e.originalEvent.changedTouches;
				for (var i = 0; i < touches.length; i++) {
					dropAtPointer(touches[i]);
				}
			})
			// Onda grande al hacer clic
			.on('mousedown.ripples', function(e) {
				dropAtPointer(e, true);
			});
	},

	// Cargar imagen desde opciones o CSS (se reemplazará por video si es necesario)
	loadImage: function() {
		var that = this;

		gl = this.context;

		var newImageSource = this.imageUrl ||
			extractUrl(this.originalCssBackgroundImage) ||
			extractUrl(this.$el.css('backgroundImage'));

		// Si la fuente no ha cambiado, no recargar
		if (newImageSource == this.imageSource) {
			return;
		}

		this.imageSource = newImageSource;

		// Si no hay fuente, usar textura transparente
		if (!this.imageSource) {
			this.setTransparentTexture();
			return;
		}
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 03 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Método para cargar el video como textura base
loadVideoTexture: function() {
	var video = document.getElementById('video-background');
	if (!video) {
		this.setTransparentTexture();
		return;
	}

	const that = this;
	this.videoElement = video;

	// Esperar a que el video tenga datos válidos si aún no está listo
	if (video.readyState < video.HAVE_CURRENT_DATA) {
		video.addEventListener('loadeddata', function handleReady() {
			video.removeEventListener('loadeddata', handleReady);
			that.loadVideoTexture(); // Reintentar carga con datos válidos
		});
		return;
	}

	this.backgroundTexture = gl.createTexture();

	gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	this.backgroundWidth = video.videoWidth || this.$el.innerWidth();
	this.backgroundHeight = video.videoHeight || this.$el.innerHeight();
}

// Bucle principal de animación
step: function() {
	gl = this.context;

	if (!this.visible) return;

	this.computeTextureBoundaries();

	if (this.running) {
		this.update();
	}

	this.render();
},

// Dibuja el quad completo (pantalla completa)
drawQuad: function() {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
},

// Renderiza el efecto final con distorsión
render: function() {
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, this.canvas.width, this.canvas.height);

	gl.enable(gl.BLEND);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.useProgram(this.renderProgram.id);

	// Actualizar la textura del video en cada frame
	if (this.videoElement && this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
		gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.videoElement);
	}

	bindTexture(this.backgroundTexture, 0);
	bindTexture(this.textures[0], 1);

	gl.uniform1f(this.renderProgram.locations.perturbance, this.perturbance);
	gl.uniform2fv(this.renderProgram.locations.topLeft, this.renderProgram.uniforms.topLeft);
	gl.uniform2fv(this.renderProgram.locations.bottomRight, this.renderProgram.uniforms.bottomRight);
	gl.uniform2fv(this.renderProgram.locations.containerRatio, this.renderProgram.uniforms.containerRatio);
	gl.uniform1i(this.renderProgram.locations.samplerBackground, 0);
	gl.uniform1i(this.renderProgram.locations.samplerRipples, 1);

	this.drawQuad();
	gl.disable(gl.BLEND);
},

// Actualiza la simulación de ondas
update: function() {
	gl.viewport(0, 0, this.resolution, this.resolution);
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.bufferWriteIndex]);
	bindTexture(this.textures[this.bufferReadIndex]);
	gl.useProgram(this.updateProgram.id);

	this.drawQuad();
	this.swapBufferIndices();
},

// Alterna los índices de lectura y escritura de buffers
swapBufferIndices: function() {
	this.bufferWriteIndex = 1 - this.bufferWriteIndex;
	this.bufferReadIndex = 1 - this.bufferReadIndex;
},

// Calcula los límites de la textura de fondo en relación al canvas
computeTextureBoundaries: function() {
	var backgroundSize = this.$el.css('background-size');
	var backgroundAttachment = this.$el.css('background-attachment');
	var backgroundPosition = translateBackgroundPosition(this.$el.css('background-position'));

	// El "contenedor" depende del tipo de attachment
	var container;
	if (backgroundAttachment == 'fixed') {
		container = { left: window.pageXOffset, top: window.pageYOffset };
		container.width = $window.width();
		container.height = $window.height();
	} else {
		container = this.$el.offset();
		container.width = this.$el.innerWidth();
		container.height = this.$el.innerHeight();
	}

	// TODO: soporte para background-clip
	if (backgroundSize == 'cover') {
		var scale = Math.max(container.width / this.backgroundWidth, container.height / this.backgroundHeight);
		var backgroundWidth = this.backgroundWidth * scale;
		var backgroundHeight = this.backgroundHeight * scale;
	}
	else if (backgroundSize == 'contain') {
		var scale = Math.min(container.width / this.backgroundWidth, container.height / this.backgroundHeight);
		var backgroundWidth = this.backgroundWidth * scale;
		var backgroundHeight = this.backgroundHeight * scale;
	}
	else {
		backgroundSize = backgroundSize.split(' ');
		var backgroundWidth = backgroundSize[0] || '';
		var backgroundHeight = backgroundSize[1] || backgroundWidth;

		if (isPercentage(backgroundWidth)) {
			backgroundWidth = container.width * parseFloat(backgroundWidth) / 100;
		} else if (backgroundWidth != 'auto') {
			backgroundWidth = parseFloat(backgroundWidth);
		}

		if (isPercentage(backgroundHeight)) {
			backgroundHeight = container.height * parseFloat(backgroundHeight) / 100;
		} else if (backgroundHeight != 'auto') {
			backgroundHeight = parseFloat(backgroundHeight);
		}

		if (backgroundWidth == 'auto' && backgroundHeight == 'auto') {
			backgroundWidth = this.backgroundWidth;
			backgroundHeight = this.backgroundHeight;
		} else {
			if (backgroundWidth == 'auto') {
				backgroundWidth = this.backgroundWidth * (backgroundHeight / this.backgroundHeight);
			}
			if (backgroundHeight == 'auto') {
				backgroundHeight = this.backgroundHeight * (backgroundWidth / this.backgroundWidth);
			}
		}
	}

	// Calcular backgroundX y backgroundY en coordenadas absolutas
	var backgroundX = backgroundPosition[0];
	var backgroundY = backgroundPosition[1];

	if (isPercentage(backgroundX)) {
		backgroundX = container.left + (container.width - backgroundWidth) * parseFloat(backgroundX) / 100;
	} else {
		backgroundX = container.left + parseFloat(backgroundX);
	}

	if (isPercentage(backgroundY)) {
		backgroundY = container.top + (container.height - backgroundHeight) * parseFloat(backgroundY) / 100;
	} else {
		backgroundY = container.top + parseFloat(backgroundY);
	}

	var elementOffset = this.$el.offset();

	this.renderProgram.uniforms.topLeft = new Float32Array([
		(elementOffset.left - backgroundX) / backgroundWidth,
		(elementOffset.top - backgroundY) / backgroundHeight
	]);

	this.renderProgram.uniforms.bottomRight = new Float32Array([
		this.renderProgram.uniforms.topLeft[0] + this.$el.innerWidth() / backgroundWidth,
		this.renderProgram.uniforms.topLeft[1] + this.$el.innerHeight() / backgroundHeight
	]);

	var maxSide = Math.max(this.canvas.width, this.canvas.height);

	this.renderProgram.uniforms.containerRatio = new Float32Array([
		this.canvas.width / maxSide,
		this.canvas.height / maxSide
	]);
},
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 04 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
initShaders: function() {
	var vertexShader = [
		'attribute vec2 vertex;',
		'varying vec2 coord;',
		'void main() {',
			'coord = vertex * 0.5 + 0.5;',
			'gl_Position = vec4(vertex, 0.0, 1.0);',
		'}'
	].join('\n');

	// Shader para generar perturbaciones (gotas)
	this.dropProgram = createProgram(vertexShader, [
		'precision highp float;',
		'const float PI = 3.141592653589793;',
		'uniform sampler2D texture;',
		'uniform vec2 center;',
		'uniform float radius;',
		'uniform float strength;',
		'varying vec2 coord;',
		'void main() {',
			'vec4 info = texture2D(texture, coord);',
			'float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);',
			'drop = 0.5 - cos(drop * PI) * 0.5;',
			'info.r += drop * strength;',
			'gl_FragColor = info;',
		'}'
	].join('\n'));

	// Shader para propagar las ondas
	this.updateProgram = createProgram(vertexShader, [
		'precision highp float;',
		'uniform sampler2D texture;',
		'uniform vec2 delta;',
		'varying vec2 coord;',
		'void main() {',
			'vec4 info = texture2D(texture, coord);',
			'vec2 dx = vec2(delta.x, 0.0);',
			'vec2 dy = vec2(0.0, delta.y);',
			'float average = (',
				'texture2D(texture, coord - dx).r +',
				'texture2D(texture, coord - dy).r +',
				'texture2D(texture, coord + dx).r +',
				'texture2D(texture, coord + dy).r',
			') * 0.25;',
			'info.g += (average - info.r) * 2.0;',
			'info.g *= 0.995;',
			'info.r += info.g;',
			'gl_FragColor = info;',
		'}'
	].join('\n'));
	gl.uniform2fv(this.updateProgram.locations.delta, this.textureDelta);

	// Shader para renderizar la textura distorsionada
	this.renderProgram = createProgram([
		'precision highp float;',
		'attribute vec2 vertex;',
		'uniform vec2 topLeft;',
		'uniform vec2 bottomRight;',
		'uniform vec2 containerRatio;',
		'varying vec2 ripplesCoord;',
		'varying vec2 backgroundCoord;',
		'void main() {',
			'backgroundCoord = mix(topLeft, bottomRight, vertex * 0.5 + 0.5);',
			'backgroundCoord.y = 1.0 - backgroundCoord.y;',
			'ripplesCoord = vec2(vertex.x, -vertex.y) * containerRatio * 0.5 + 0.5;',
			'gl_Position = vec4(vertex.x, -vertex.y, 0.0, 1.0);',
		'}'
	].join('\n'), [
		'precision highp float;',
		'uniform sampler2D samplerBackground;',
		'uniform sampler2D samplerRipples;',
		'uniform vec2 delta;',
		'uniform float perturbance;',
		'varying vec2 ripplesCoord;',
		'varying vec2 backgroundCoord;',
		'void main() {',
			'float height = texture2D(samplerRipples, ripplesCoord).r;',
			'float heightX = texture2D(samplerRipples, vec2(ripplesCoord.x + delta.x, ripplesCoord.y)).r;',
			'float heightY = texture2D(samplerRipples, vec2(ripplesCoord.x, ripplesCoord.y + delta.y)).r;',
			'vec3 dx = vec3(delta.x, heightX - height, 0.0);',
			'vec3 dy = vec3(0.0, heightY - height, delta.y);',
			'vec2 offset = -normalize(cross(dy, dx)).xz;',
			'float specular = pow(max(0.0, dot(offset, normalize(vec2(-0.6, 1.0)))), 4.0);',
			'gl_FragColor = texture2D(samplerBackground, backgroundCoord + offset * perturbance) + specular;',
		'}'
	].join('\n'));
	gl.uniform2fv(this.renderProgram.locations.delta, this.textureDelta);
},

// Inicializa la textura de fondo (se usará para video)
initTexture: function() {
	this.backgroundTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
},

// Carga una textura transparente como fondo por defecto
setTransparentTexture: function() {
	gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, transparentPixels);
},

// Oculta el fondo CSS original del elemento
hideCssBackground: function() {
	var inlineCss = this.$el[0].style.backgroundImage;
	if (inlineCss == 'none') return;

	this.originalInlineCss = inlineCss;
	this.originalCssBackgroundImage = this.$el.css('backgroundImage');
	this.$el.css('backgroundImage', 'none');
},

// Restaura el fondo CSS original si se destruye el efecto
restoreCssBackground: function() {
	this.$el.css('backgroundImage', this.originalInlineCss || '');
},

// Aplica una gota en la posición del puntero
dropAtPointer: function(pointer, radius, strength) {
	var borderLeft = parseInt(this.$el.css('border-left-width')) || 0,
		borderTop = parseInt(this.$el.css('border-top-width')) || 0;

	this.drop(
		pointer.pageX - this.$el.offset().left - borderLeft,
		pointer.pageY - this.$el.offset().top - borderTop,
		radius,
		strength
	);
},

/**
 * Métodos públicos
 */
drop: function(x, y, radius, strength) {
	gl = this.context;

	var elWidth = this.$el.innerWidth();
	var elHeight = this.$el.innerHeight();
	var longestSide = Math.max(elWidth, elHeight);

	radius = radius / longestSide;

	var dropPosition = new Float32Array([
		(2 * x - elWidth) / longestSide,
		(elHeight - 2 * y) / longestSide
	]);

	gl.viewport(0, 0, this.resolution, this.resolution);

	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.bufferWriteIndex]);
	bindTexture(this.textures[this.bufferReadIndex]);

	gl.useProgram(this.dropProgram.id);
	gl.uniform2fv(this.dropProgram.locations.center, dropPosition);
	gl.uniform1f(this.dropProgram.locations.radius, radius);
	gl.uniform1f(this.dropProgram.locations.strength, strength);

	this.drawQuad();
	this.swapBufferIndices();
},

// Actualiza el tamaño del canvas si cambia el tamaño del contenedor
updateSize: function() {
	var newWidth = this.$el.innerWidth(),
		newHeight = this.$el.innerHeight();

	if (newWidth != this.canvas.width || newHeight != this.canvas.height) {
		this.canvas.width = newWidth;
		this.canvas.height = newHeight;
	}
},

// Destruye el efecto y limpia eventos
destroy: function() {
	this.$el
		.off('.ripples')
		.removeClass('jquery-ripples')
		.removeData('ripples');
},
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 05 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Destruye el efecto y limpia eventos
destroy: function() {
	gl = null; // Liberar contexto WebGL

	$(window).off('resize', this.updateSize);

	this.$canvas.remove();
	this.restoreCssBackground();

	this.destroyed = true;
},

// Mostrar el canvas y ocultar fondo CSS
show: function() {
	this.visible = true;
	this.$canvas.show();
	this.hideCssBackground();
},

// Ocultar el canvas y restaurar fondo CSS
hide: function() {
	this.visible = false;
	this.$canvas.hide();
	this.restoreCssBackground();
},

// Pausar la simulación
pause: function() {
	this.running = false;
},

// Reanudar la simulación
play: function() {
	this.running = true;
},

// Cambiar propiedades dinámicamente
set: function(property, value) {
	switch (property) {
		case 'dropRadius':
		case 'perturbance':
		case 'interactive':
		case 'crossOrigin':
			this[property] = value;
			break;
		case 'imageUrl':
			this.imageUrl = value;
			this.loadVideoTexture(); // ← reemplazo para usar video como textura
			break;
	}
}
};

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PLUGIN JQUERY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

var old = $.fn.ripples;

$.fn.ripples = function(option) {
	if (!config) {
		throw new Error('Tu navegador no soporta WebGL, la extensión OES_texture_float o el renderizado en texturas flotantes.');
	}

	var args = (arguments.length > 1) ? Array.prototype.slice.call(arguments, 1) : undefined;

	return this.each(function() {
		var $this = $(this),
			data = $this.data('ripples'),
			options = $.extend({}, Ripples.DEFAULTS, $this.data(), typeof option == 'object' && option);

		if (!data && typeof option == 'string') {
			return;
		}
		if (!data) {
			$this.data('ripples', (data = new Ripples(this, options)));
		}
		else if (typeof option == 'string') {
			Ripples.prototype[option].apply(data, args);
		}
	});
};

$.fn.ripples.Constructor = Ripples;

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ NO CONFLICT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$.fn.ripples.noConflict = function() {
	$.fn.ripples = old;
	return this;
};