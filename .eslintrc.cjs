module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
      "react",
      "css-modules-case"
    ],
    "rules": {
      "no-console":"error",
      "css-modules-case/no-camel-case":[ "error" , {
        "case" :"snake"
      }
      ]
    }
};
