
(function($) {


Drupal.behaviors.galerie = {
  attach: function (context) {
    $('.node-galerie', context).each(function() {
      var nid = $(this).attr('id').replace(/^node-/, '');
      Drupal.galerie.settings(nid).element = $(this);

      if ($(this).hasClass('node-teaser')) {
      } else {
        // let's assume there is only one, for this.
        if (document.location.hash != '') {
          var id = document.location.hash.substr(1);
          Drupal.galerie.showImageAjax(nid, id);
        } else if (history.state && history.state.current) {
          var id = history.state.current;
          Drupal.galerie.showImageAjax(nid, id);
        }

        if (history.state && history.state.offset) {
          Drupal.galerie.loadMoreThumbs(nid, history.state.offset);
        }

        $(this).find('.galerie-browser img').live('click', function() {
          var image_id = $(this).attr('id').replace('galerie-', '');

          Drupal.galerie.showImageAjax(nid, image_id);

          return false;
        });

        $(this).find('.galerie-browser-more a').click(function() {
          Drupal.galerie.loadMoreThumbs(nid);
          return false;
        });

        var infiniteScrollCallback = (function(wrapper) {
          return function() {
            var top = wrapper.scrollTop();
            var totalHeight = wrapper[0].scrollHeight;
            var frameHeight = wrapper.height();

            var hiddenHeight = totalHeight - frameHeight;

            if (hiddenHeight-top < 150) {
              if (history.replaceState) {
                history.replaceState({current: Drupal.galerie.settings(nid).current, offset: Drupal.galerie.settings(nid).offset}, '', '');
              }

              Drupal.galerie.loadMoreThumbs(nid);
            }
          };
        })($(this).find('.galerie-browser-wrapper'));

        Drupal.galerie.settings(nid).infiniteScrollInterval = setInterval(infiniteScrollCallback, 250);

        var grippie = $('<div class="grippie"></div>', context);
        var galerie = $(this).find('.galerie-wrapper');
        galerie.after(grippie);

        var startDrag = function(e) {
          staticOffset = galerie.height() - e.pageY;
          galerie.animate({opacity: 0.5}, 50);
          $(document).mousemove(performDrag).mouseup(endDrag);
          return false;
        };

        var performDrag = function(e) {
          galerie.height(Math.max(32, staticOffset + e.pageY) + 'px');
          return false;
        };

        var endDrag = function(e) {
          $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
          galerie.animate({opacity: 1}, 50);
          return false;
        };

        grippie.mousedown(startDrag);
      }
    });
  }
};

Drupal.galerie = Drupal.galerie || {
  loadingMoreThumbs: false,
};

Drupal.galerie.settings = function(nid) {
  return Drupal.settings.galerie['galerie-' + nid];
}

Drupal.galerie.loadMoreThumbs = function(nid, to_offset) {
  if (!Drupal.galerie.loadingMoreThumbs) {
    Drupal.galerie.loadingMoreThumbs = true;

    $('body').addClass('galerie-ajax-waiting');

    if (to_offset && to_offset > Drupal.galerie.settings(nid).offset) {
      var count = Drupal.galerie.settings(nid).offset - to_offset + Drupal.galerie.settings(nid).count;
    } else {
      var count = Drupal.galerie.settings(nid).count;
    }

    $.ajax({
      url: Drupal.galerie.settings(nid).imageListUrl + '/' + Drupal.galerie.settings(nid).offset + '/' + count,
      success: function(json) {
        Drupal.galerie.appendThumbs(nid, json);
      },
      dataType: 'json',
      complete: function() {
        Drupal.galerie.loadingMoreThumbs = false;
        $('body').removeClass('galerie-ajax-waiting');
      },
    });
  }
};

Drupal.galerie.appendThumbs = function(nid, json) {
  if (json.count == 0) {
    Drupal.galerie.settings(nid).element.find('.galerie-browser-more').fadeOut();
    clearTimeout(Drupal.galerie.settings(nid).infiniteScrollInterval);
  } else {
    Drupal.galerie.settings(nid).offset += json.count;
    Drupal.galerie.settings(nid).element.find('.galerie-browser').append(json.markup);
  }
};

Drupal.galerie.showImageAjax = function(nid, image_id) {
  $('body').addClass('galerie-ajax-waiting');

  $.ajax({
    url: Drupal.galerie.settings(nid).imageInfoUrl + '/' + encodeURIComponent(image_id),
    success: function(json) {
      Drupal.galerie.settings(nid).current = image_id;
      if (history.replaceState) {
        history.replaceState({current: Drupal.galerie.settings(nid).current, offset: Drupal.galerie.settings(nid).offset}, '', Drupal.galerie.settings(nid).baseUrl + '/' + image_id);
      } else {
        document.location.hash = '#' + image_id;
      }
      Drupal.galerie.showImage(nid, json);
    },
    dataType: 'json',
    complete: function() {
      $('body').removeClass('galerie-ajax-waiting');
    },
  });
};

Drupal.galerie.showImage = function(nid, json) {
  var image = $(json.markup).hide();
  image.find('img').load(
    (function(image) {
      return function() {
        image.fadeIn()
      }
    })(image)
  );
  Drupal.attachBehaviors(image);

  if (Drupal.galerie.settings(nid).multiple) {
	  Drupal.galerie.settings(nid).element.find('.galerie-viewer').prepend(image);
  } else {
    if (Drupal.galerie.settings(nid).element.find('.galerie-viewer').children().size()) {
      Drupal.galerie.settings(nid).element.find('.galerie-viewer').children().fadeOut('fast', function() {
        Drupal.galerie.settings(nid).element.find('.galerie-viewer').html(image);
      });
    } else {
        Drupal.galerie.settings(nid).element.find('.galerie-viewer').html(image);
    }
  }
};

})(jQuery);
