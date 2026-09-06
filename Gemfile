source "https://rubygems.org"
gemspec

# Windows 및 JRuby에는 타임존 데이터가 없어 tzinfo-data 를 함께 번들해야 함
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end
