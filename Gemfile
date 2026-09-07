source "https://rubygems.org"

# 이 저장소는 테마 젬이 아니라 블로그 본체다.
# 테마 파일(_layouts / _includes / _sass)은 저장소 안에 직접 두고 쓰므로,
# 예전 gemspec 이 선언하던 런타임 의존성만 여기에 그대로 옮겨 적는다.
gem "jekyll", ">= 3.7", "< 5.0"
gem "jekyll-paginate", "~> 1.1"
gem "jekyll-sitemap", "~> 1.3"
gem "jekyll-gist", "~> 1.5"
gem "jekyll-feed", "~> 0.1"
gem "jekyll-include-cache", "~> 0.1"

# 카테고리 정리로 바뀐 예전 글 주소를 새 주소로 넘겨준다 (GitHub Pages 기본 빌드도 지원)
gem "jekyll-redirect-from", "~> 0.16"

# Windows 및 JRuby에는 타임존 데이터가 없어 tzinfo-data 를 함께 번들해야 함
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end
