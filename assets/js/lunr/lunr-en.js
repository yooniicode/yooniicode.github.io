---
layout: none
---

var idx = lunr(function () {
  this.field('title')
  this.field('excerpt')
  this.field('categories')
  this.field('tags')
  this.ref('id')

  this.pipeline.remove(lunr.trimmer)

  for (var item in store) {
    this.add({
      title: store[item].title,
      excerpt: store[item].excerpt,
      categories: store[item].categories,
      tags: store[item].tags,
      id: item
    })
  }
});

$(document).ready(function() {
  $('input#search').on('keyup', function () {
    var resultdiv = $('#results');
    var query = $(this).val().toLowerCase();
    var result =
      idx.query(function (q) {
        query.split(lunr.tokenizer.separator).forEach(function (term) {
          q.term(term, { boost: 100 })
          if(query.lastIndexOf(" ") != query.length-1){
            q.term(term, {  usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 })
          }
          // 한국어는 조사·어미가 붙은 어절 하나가 통째로 토큰이 된다
          // ("스프링시큐리티를"). 뒤쪽 와일드카드만으로는 앞에서부터 맞는
          // 경우("스프링")만 걸리므로, 어절 가운데·끝에서 맞는 경우
          // ("시큐리티")까지 잡으려면 양쪽 와일드카드가 필요하다.
          // 앞 와일드카드는 색인 전체를 훑지만 글이 수십 편 규모라 부담이 없다.
          if (term != ""){
            q.term(term, {
              usePipeline: false,
              wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING,
              boost: 5
            })
          }
          if (term != ""){
            q.term(term, {  usePipeline: false, editDistance: 1, boost: 1 })
          }
        })
      });
    resultdiv.empty();
    resultdiv.prepend('<p class="results__found">'+result.length+' {{ site.data.ui-text[site.locale].results_found | default: "Result(s) found" }}</p>');
    for (var item in result) {
      var ref = result[item].ref;
      if(store[ref].teaser){
        var searchitem =
          '<div class="list__item">'+
            '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">'+
              '<h2 class="archive__item-title" itemprop="headline">'+
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>'+
              '</h2>'+
              '<div class="archive__item-teaser">'+
                '<img src="'+store[ref].teaser+'" alt="">'+
              '</div>'+
              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.split(" ").splice(0,20).join(" ")+'...</p>'+
            '</article>'+
          '</div>';
      }
      else{
    	  var searchitem =
          '<div class="list__item">'+
            '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">'+
              '<h2 class="archive__item-title" itemprop="headline">'+
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>'+
              '</h2>'+
              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.split(" ").splice(0,20).join(" ")+'...</p>'+
            '</article>'+
          '</div>';
      }
      resultdiv.append(searchitem);
    }
  });

  // 이 스크립트는 검색을 열 때 비동기로 붙는다(_includes/search/lunr-search-scripts.html).
  // 로드가 끝나기 전에 이미 몇 글자 쳐 넣었을 수 있으므로, 핸들러를 걸자마자
  // 현재 입력값으로 한 번 돌려서 결과를 맞춰준다.
  var $input = $('input#search');
  if ($input.length && $input.val()) {
    $input.trigger('keyup');
  }
});
