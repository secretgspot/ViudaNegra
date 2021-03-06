/**************************************************************************
 * Name:   EmbedPicasaGallery
 * Author: Tobias Oetiker <tobi@oetiker.ch>
 * Demo:   http://tobi.oetiker.ch/photo/
 * $Id: jquery.EmbedPicasaGallery.js 474 2011-06-16 09:02:45Z oetiker $
 **************************************************************************
 Description:

 [elided]

**********************************************************************************/

(function($) {
    // setup a namespace for us
    var nsp = 'EmbedPicasaGallery', authkey;

    // Private Variables and Functions in the _ object
    // note that this will refer to _ unless you
    // call using the call or apply methods

    // Public Variables and Methods
    $[nsp] = {
        defaultOptions: {
            matcher : RegExp('.+'),
            size    : 72,
            msg_loading_list : 'esperese..',
            msg_back : 'vuelta',
            msg_more : 'mas',
            album_title_tag: '<h2/>',
            auto_open: false,
            thumb_id_prefix: 'pThumb_',
            thumb_tuner: null,
            thumb_finalizer: null,
            loading_animation: null,
            show_more: null,
            hide_back: false,
            link_mapper: function(el){
                    return [
                        el.href,
                        '<a href="'+el.href+'">'+el.title+'</a>'
                    ]
                }
        }
    };
    $.fn[nsp] = function(user,opts) {
        var localOpts,
            Cache = {};

        localOpts = $.extend(
            {}, // start with an empty map
            $[nsp].defaultOptions, // add defaults
            opts // add options
        );

        function callbackWithInfo(opts,callback,idx,info) {
            if (opts[callback] &&
                $.isArray(opts[callback]) &&
                $.isFunction(opts[callback][idx])) {
              opts[callback][idx](info);
            }
        }

        function showOverview() {
            var $this,
                meta_opts,
                albumCount,
                $album_list,
                authkey = '';

            if ( Cache.__overview ){
                 Cache.__overview.show();
                 return;
            }
            $this = $(this);
            $this.empty();
            meta_opts = localOpts;
            if ($.meta){
                meta_opts = $.extend({}, localOpts, $this.data());
            }
            albumCount = 0;
            $album_list = $('<div/>')
                .addClass('album-list')
                .css('position','relative')
                .css('overflow','hidden')
                .append($('<div/>').text(meta_opts.msg_loading_list));


            function appendImage(i,item){
                var title,$div,$img,desc;
                title = item.media$group.media$title.$t;
                desc = item.media$group.media$description.$t;
                if (title.match(meta_opts.matcher)){
                    albumCount++;
                    $img = $('<img/>')
                        .attr('title',title)
                        .attr('src',item.media$group.media$thumbnail[0].url)
                    $div = $('<div/>')
                        .addClass('album-cover')
                        .css({
                            'float': 'left',
                            marginRight: '10px',
                            marginBottom: '10px'
                        })
                        .click(function () {
                           $album_list.hide();
                           showAlbum($this,meta_opts,item.gphoto$id.$t,title,item.gphoto$numphotos.$t,desc);
                        })
                        .hover(
                            function () {
                                $(this).css("cursor","pointer");
                                callbackWithInfo(meta_opts,'album_hover',0, {
                                    title: title,
                                    photoCount: item.gphoto$numphotos.$t,
                                    description: desc
                                });
                                $(this).css("cursor","pointer")
                            },
                            function () {
                                $(this).css("cursor","default");
                                callbackWithInfo(meta_opts,'album_hover',1,{});
                            }
                        )
                        .append( $img )
                        .append(
                            $('<div/>')
                            .addClass('album-title')
                            .css({
                                'font-size': '10px'
                            })
                            .text(title)
                            .width( meta_opts.size )
                        )
                    $album_list.append($div);
                };
            }

            function renderAlbumList(data){
                var $albums,maxHeight=0;
                $album_list.empty();
                if (data.feed && data.feed.entry){
                    $.each(data.feed.entry,appendImage);
                } else {
                      $this.text('Warning: No picasa albums found for user ' + user);
                }
                Cache.__overview = $album_list;
                $albums = $album_list.children();


                if (meta_opts.auto_open){
                    $albums.eq(0).click();
                    return;
                }
                $('.album-title',$album_list)
                .each(function(){
                     var h = $(this).outerHeight();
                     if (h > maxHeight){
                        maxHeight = h
                     }
                })
                .each(function(){
                    $(this).height(maxHeight)
                });

            }


            if (meta_opts.authkey){
                authkey = '&authkey=' + meta_opts.authkey;
            }

            if (meta_opts.albumid) {
                  showAlbum($this,meta_opts,meta_opts.albumid)
            }
            else {
                $this.prepend($album_list);
                $.getJSON('http://picasaweb.google.com/data/feed/api/user/'
                    + user + '?kind=album&access=visible' + authkey
                    + '&alt=json-in-script&thumbsize=' + meta_opts.size + 'c&callback=?',
                    renderAlbumList
               );
            }
        };

        function showAlbum($this,meta_opts,album,title,photoCount,desc){
            callbackWithInfo(meta_opts,'album_toggle',0,{
                title: title,
                photoCount: photoCount,
                description: desc
            });

            if ( Cache[album] ){
               Cache[album].show();
               return;
            };

            var i,$album,albumPics=[],$picDiv;

            $album = $('<div/>').addClass('album')
                .css('position','relative')
                .css('overflow','hidden');

            if (title){
                $album.append($(meta_opts.album_title_tag).text(title))
            }
            function makeDiv(){
               var $div = $('<div/>')
                   .css({
                        'float': 'left',
                        marginRight: '10px',
                        marginBottom: '10px',
                        width: meta_opts.size+'px',
                        height: meta_opts.size+'px'
                    });
               if (meta_opts.loading_animation){
                   $div.css('background','url(' + meta_opts.loading_animation + ') no-repeat center center');
               }
               return $div;
            }

            function makeButton(text){
                return $("<div/>")
                    .addClass("pic-thumb")
                    .width(meta_opts.size)
                    .height(meta_opts.size)
                    .css({borderWidth: '0px',
                         'float' : 'left',
                         marginRight: '10px',
                         marginBottom: '10px',
                         cursor: 'pointer'
                     })
                    .append($("<div/>")
                        .html('<br/>'+text)
                        .addClass('gal-button')
                        .css({'borderStyle':'outset',
                              'borderWidth':'1px',
                              'textAlign'  :'center',
                              'width'       : (meta_opts.size - 2) + 'px',
                              'height'      : (meta_opts.size - 2) + 'px'
                        })
                    );
            }

            if (Cache.__overview && !meta_opts.hide_back){
                $album.append(makeButton(meta_opts.msg_back)
                    .click(function(){
                        callbackWithInfo(meta_opts,'album_toggle',1,{});
                        $album.hide();
                        showOverview()})
                );
            }
            $this.prepend($album);

            if (photoCount){
                for (i=0;i<photoCount && (!meta_opts.show_more || i<meta_opts.show_more);i++) {
                    $picDiv = makeDiv();
                    $album.append($picDiv);
                    albumPics.push($picDiv);
                }
            }

            function makeImage(i,item){
               var title = item.media$group.media$description.$t || item.media$group.media$title.$t;
               var $div = albumPics[i] || makeDiv();

               var $img = $('<img/>')
                      .css('borderWidth','0px')
               .hide()
                   .load(function(){
                       if (meta_opts.thumb_tuner){
                           meta_opts.thumb_tuner(this,item);
                       }
               $img.show();
                   });




               var thumbs = item.media$group.media$thumbnail;
           var gotOne = false;
               for (var i = 0; i<thumbs.length;i++){
                    if (thumbs[i].width == meta_opts.size && thumbs[i].height == meta_opts.size){
                        $img.attr("src", thumbs[i].url);
            gotOne = true;
                        break;
                    }
               }
           if (!gotOne){
               $img.attr("alt","Sorry, no matching thumbnail found.");
           }

               var $a = $("<a/>")
                   .attr("href",item.content.src)
                   .attr("title",title)
                   .append($img);

               $div
                   .attr("id", meta_opts.thumb_id_prefix + item.gphoto$id.$t )
                   .append($a);


               return $div;
            }

            function renderAlbum(data){
                var images = data.feed.entry;
                var hiddenImages = [];
                for (var i=0;i<images.length;i++){
                    var $div = makeImage(i,images[i]);
                    if (!meta_opts.show_more || i < meta_opts.show_more){
                        $div.show();
                    }
                    else {
                        $div.hide();
                        hiddenImages.push($div);
                    }
                    $album.append($div);

                    if (meta_opts.show_more && i == meta_opts.show_more){
                        var $moreButton = makeButton(meta_opts.msg_more);
                        $album.append($moreButton
                            .click(function(){
                                var start = 0;
                                jQuery.each(hiddenImages,function(i,$img){
                                    window
                                        .setTimeout(
                                            function(){
                                                $img.fadeIn('fast');
                                            },
                                            50*(start++)
                                        );
                                });
                                $moreButton.hide();
                            })
                        );
                    }
                }
                if ($.fn.slimbox){
                    $('a',$album).slimbox({},meta_opts.link_mapper);
                }
                if (meta_opts.thumb_callback){
                    $('a',$album).each(meta_opts.thumb_callback);
                }
                Cache[album] = $album;
            }
            authkey = '';
            if (meta_opts.authkey){
               authkey = '&authkey=' + meta_opts.authkey;
            }
            $.getJSON('http://picasaweb.google.com/data/feed/api/user/'
                + user + '/albumid/'
                + album + '?kind=photo&access=visible' + authkey + '&alt=json-in-script&thumbsize='+meta_opts.size+'c&imgmax=800&callback=?',
                renderAlbum
            );
        };

        return this.each(showOverview);
    };
})(jQuery);