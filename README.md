# N-Way Diff
2-way diffs are not enough? Try N-Way Diff!

# Motivation
When working with servless environments, our team had to handle a lot of files for lots of different envisonments. Most but not all parts had to stay in sync. Some have to be different as they contain the environments specific names, etc.. With a growing team, it became harder and harder to maintain those environment files and every new feature sometimes brought more files or more changes to those files. Sure we could change the way we manage our environments, but other solutions require more complex approaches. So i wrote a script to see all differences between the environments. And eventually this came out.

# How to Use
Install dependencies once.
```
npm ci
```

Example use with tests.
```
./src/index.js test
```

Lint with `eslint` and `npx`.
```
npx eslint .
```

Debug middlewares in serve mode.
```
DEBUG=connect:dispatcher ./src/index.js test --serve
```
