(function () {
    var canvas = new fabric.Canvas('canvas');
    var canvas_el = document.getElementById('canvas');
    var textArea = document.getElementById('text-input');
    var imgTag, formatted1;

    function dragDropInit(){
            /* Define drag and drop zones */
        var $drop = $('#canvas-drop-area'),
            $gallery = $('#image-list li');

        /* Define the draggable properties */
        $gallery.draggable({
            start: function () {
                $drop.css({
                    'display': 'block'
                })
            },
            stop: function () {
                $(this).find('img').css({
                    'opacity': 0.9
                });
                $drop.css({
                    'display': 'none'
                });
            },
            revert: true
        });

        /* Define the events for droppable properties */
        $drop.droppable({
            over: function (event, ui) {
                $(this).addClass('active');
            },
            drop: function (event, ui) {
                var image = event.originalEvent.target.src,
                    loc = windowToCanvas(canvas_el, event.clientX, event.clientY);
                   // console.log('image', event.originalEvent.target.src);

                img_to_canvas(image, loc.x, loc.y);
            },
            out: function (event, ui) {
                $(this).removeClass('active');
            },
            deactivate: function (event, ui) {
                $(this).removeClass('active');
            }
        });
        var img_to_canvas = function(image, x, y) {
            var img = new Image();
            img.src = image;
            fabric.Image.fromURL(image, function (source) {
                img = source.set({
                    left: x,
                    top: y,
                    angle: 0
                });
                console.log('fabric image', image);
                // imgTag = canvas.toDataURL('image/jpg');
                imgTag = image;
                canvas.add(img);
                canvas.renderAll();
        });
    }

        var windowToCanvas = function(canvas, x, y) {
            var bbox = canvas.getBoundingClientRect();
            return {
                x: x - bbox.left * (canvas.width / bbox.width),
                y: y - bbox.top * (canvas.height / bbox.height)
            };
        }
    }

    $(document).ready(function () {
        /* Bring active object to the front of the canvas */
        canvas.on('mouse:down', function (e) {
            if (!(typeof (e.target) === 'undefined')) {
                canvas.bringToFront(e.target);
            }
        });
        dragDropInit()
       
    });   

     /* Handle text input with canvas and display on image */
    function wrapCanvasText(t, canvas, maxW, maxH) {
        if (typeof maxH === "undefined") {
            maxH = 0;
        }

        var words = t.split(" ");
        var formatted = '';
      
        var sansBreaks = t.replace(/(\r\n|\n|\r)/gm, "");
        
        var lineHeight = new fabric.Text(sansBreaks, {
            fontFamily: t.fontFamily,
            fontSize: 25 //t.fontSize
        }).height;

        var maxHAdjusted = maxH > 0 ? maxH - lineHeight : 0;
        var context = canvas.getContext("2d");
        context.font = t.fontSize + "px " + t.fontFamily;
        
        var currentLine = "";
        var breakLineCount = 0;

        for (var n = 0; n < words.length; n++) {
            var isNewLine = currentLine == "";
            var testOverlap = currentLine + ' ' + words[n];

            var w = context.measureText(testOverlap).width;

            if (w < maxW) { 
                currentLine += words[n] + ' ';
                formatted += words[n] += ' ';
            } else {

                // handle hypenated words
                if (isNewLine) {
                  var wordOverlap = "";
                  for (var i = 0; i < words[n].length; ++i) {
                    wordOverlap += words[n].charAt(i);
                    var withHypeh = wordOverlap + "-";
                    if (context.measureText(withHypeh).width >= maxW) {
                        withHypeh = wordOverlap.substr(0, wordOverlap.length - 2) + "-";
                        words[n] = words[n].substr(wordOverlap.length - 1, words[n].length);
                        formatted += withHypeh; 
                        break;
                    }
                  }
                }
                n--; 
                formatted += '\n';
                breakLineCount++;
                currentLine = "";
            }
            if (maxHAdjusted > 0 && (breakLineCount * lineHeight) > maxHAdjusted) {
                formatted = formatted.substr(0, formatted.length - 3) + "...\n";
                break;
            }
        }
        formatted = formatted.substr(0, formatted.length - 1);
        return formatted;
      }

  $("#text-input").keyup(function (e) {
    formatted1 = wrapCanvasText(textArea.value, canvas, 275, 500);

    var activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type == 'text') {
        activeObject.text = formatted1;
        canvas.renderAll();
    } else {
      var textSample = new fabric.Text(formatted1, {
        left: 25,
        top: 400,
        fontSize: 25,
        fontFamily: 'Arial',
        backgroundColor: 'transparent',
        textAlign: "left",
        fill: "#2E4053",
        padding: 10,
        scaleX: 0.9,
        scaleY: 0.9
      });
      canvas.add(textSample);
      canvas.setActiveObject(textSample, e);
      canvas.renderAll();
    } 
  });

    /*  Handle window resizing */
    canvas.observe('object:selected', function (e) {
    oldStateObject = $.extend(true, {}, e.target);
    oldStateObject.width = oldStateObject.currentWidth;
    oldStateObject.height = oldStateObject.currentHeight;

    var activeObject = e.target;
    if (activeObject.type == 'text') {
        textArea.value = activeObject.text;
    }
  });

  function resize() {
    var canvasSizer = document.getElementById("canvasSizer");
    var canvasScaleFactor = canvasSizer.offsetWidth/800;
    var width = canvasSizer.offsetWidth;
    var height = canvasSizer.offsetHeight;
    var ratio = canvas.getWidth() /canvas.getHeight();
       if((width/height)>ratio){
         width = height*ratio;
       } else {
         height = width / ratio;
       }
    var scale = width / canvas.getWidth();
    var zoom = canvas.getZoom();
    zoom *= scale;
    canvas.setDimensions({ width: width, height: height });
    canvas.setViewportTransform([zoom , 0, 0, zoom , 0, 0]);
    }

  window.addEventListener('load', resize, false);
  window.addEventListener('resize', resize, false);

  /*  Copy and output canvas  */
  $("#btnCopy").on("click",function(event) {
    event.preventDefault();
    //console.log('image tag', imgTag);
   // var canvas = new fabric.Canvas('canvas');
   // var image = new Image();
    //image.src = imgTag;
    $('#secondDiv').append($('<img>').attr('src', imgTag)).append($('<br />'),formatted1);
  });

  /* Upload images to app */
  if (window.File && window.FileList && window.FileReader) {
    $("#files").on("change", function(e) {
      var files = e.target.files,
        filesLength = files.length;
      for (var i = 0; i < filesLength; i++) {
        var f = files[i]
        var fileReader = new FileReader();
        fileReader.onload = (function(e) {
          var file = e.target;
          $("<li class=\"ui-draggable ui-draggable-handle pip\" style=\"position: relative;\">" +
            "<span class=\"remove\">X</span>" + 
            "<img class=\"draggable-image\" src=\"" + e.target.result + "\" title=\"" + file.name + "\"/>" +           
            "</li>").insertAfter("#files");
          $(".remove").click(function(){
            $(this).parent(".pip").remove();
          });

         dragDropInit()

        });
        fileReader.readAsDataURL(f);
        }
      });
  } else {
    alert("Your browser doesn't support this type of file upload.")
  }

})();