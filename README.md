# Tango

You can memorize anything with this awesome flash cards now!

## Expo

https://exp.host/@her0e1c1/tango

## Development

Install dependencies
```
yarn
```

Compile typescript files
```
yarn build
```

Start expo
```
yarn start
```

# Config

You need to setup the configuration file.

```
cp src/secret.ts.example src/secret.ts
```

# CI
- https://circleci.com/gh/her0e1c1/tango

# Note

- react-native ver must be 0.55 not 0.56 (expo error)
- expo clients support more than 24
- papaparse requires stream on react-native
- just ignore libraries ts errors to set skipLibCheck true
- firestore can not store undefined so use null instead
