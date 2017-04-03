# gulp-nf-prettier

A [Gulp][gulp] plugin to run Prettier on your code base.

## nf?

Stands for the [Netflix][nf] fork of [gulp-pretter][gp]. We had certain requirements for the plugin so we forked it for ourselves.

## Peer Dependency

Prettier is a peer dependency of `gulp-nf-prettier`. That means you can upgrade Prettier independent of this plugin since the API shouldn't change too much. This also means that you should use [their docs][docs] to see how to utilize the library.

## check

This plugin has the ability to be run in a CI environment. Pass the `check` flag in the options and if any file hasn't been run through prettier with your options it will error, letting you fail your build.

## Example usage

```javascript
gulp
  .src(glob, { base: './' })
  .pipe(prettier({
    printWidth: 120,
    tabWidth: 2,
    parser: 'flow',
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    jsxBracketSameLine: true,
    check: true
  })
```

## Credit

Forked from [Bhargav Patel][bp]. Credit to him to getting the ball rolling. Credit to the Gulp team. Consider [donating to them][oc]. Credit to [James Long][jlong] for an amazing library. Hire him for contract work.

[gulp]: http://gulpjs.com/
[bp]: https://github.com/bhargavrpatel
[nf]: https://jobs.netflix.com/
[gp]: https://github.com/bhargavrpatel/gulp-prettier
[docs]: https://github.com/prettier/prettier
[oc]: https://opencollective.com/gulpjs
[jlong]: https://twitter.com/jlongster
