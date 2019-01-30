NodeJS Harvester
================

An easily extended nodejs derived data harvester leveraging the [cheerio][cheerio] framework.

This application will when given a series of url's alongside customizable DOM selectors specified in a csv file; parse the url's and write the generated output to a customizable database backend. The database backend is then served up in JSON via a RESTful route using the [ExpressJS][express] framework.

While parsing the url's any documents / media / images that are found will be downloaded to an appropriate media entity folder and the html markup served will be altered to instead be linked to the media entity with a customized UUID tag rather then a href tag. This approach helps to ensure a good data model when migrating content into the many different types of content management systems.

## Installation

1. Install [NodeJS][node] via the traditional [methods][methods].

2. Run the following commands from working directory:

```sh
  npm install -g bower
  npm install -g grunt-cli
  npm install
```

3. Configure your config.yml file.

4. The following [GruntJS][grunt] tasks have been registered (grunt-contrib tasks linked below):

    * [JsHint][jshint]
    * [JSCS][jscs]
    * [Uglify][uglify]
    * [Nodemon][nodemon]

```sh
  grunt harvest      // Expanded -> ['jshint', 'jscs', 'uglify', 'nodemon:harvest']
  grunt debug        // Expanded -> ['jshint', 'jscs', 'uglify', 'nodemon:debug']
  grunt export       // Expanded -> ['jshint', 'jscs', 'uglify', 'nodemon:export']
  grunt restore      // Expanded -> ['clean', 'jshint', 'jscs', 'uglify']
  grunt serve        // Expanded -> ['jshint', 'jscs', 'uglify', 'nodemon:serve']
  grunt readconfig
  grunt updateconfig
```

## Grunt Tasks

Currently their are 6 (+1 debugger) configured grunt tasks to interact with the NodeJS Harvester.

1. `Grunt Harvest`: Runs the entire harvest converting a correctly formatted CSV into a live REST Route powered by a custom db layer.
2. `Grunt Restore`: Will wipe all retrieved data and bring the harvester back to pristine state.
3. `Grunt Serve`: Instantiates the REST routes based on an instantiated database layer (sqlite3 tested) from an earlier harvest.
4. `Grunt Export`: Instantiates the REST routes based on an instantiated database layer (sqlite3 tested).
5. `Grunt ReadConfig`: Output the current YAML configuration file to stdout.
6. `Grunt UpdateConfig`: Update YAML config file with UUID as param.

## How it Works

In order to demonstrate how this library works we will be using the [import.csv][importcsv] file supplied as part of this repository as an example.

Examining the first three records from the import.csv file we have the following (edited for readability):

| id  | website            | language | pattern | title            | body                                         |
| --- | ------------------ | -------- | ------- | ---------------- | -------------------------------------------- |
| 1   | `../index-en.html` | en       | wxt3    | css::#wb-cont    | css::#wb-main-in&#124;h1&#124;#wet-date-mod  |
| 2   | `../cont-en.html`  | en       | wxt3    | css::#wb-cont    | css::#wb-main-in&#124;h1&#124;#wet-date-mod  |
| 3   | `../grids-en.html` | en       | wxt3    | css::#wb-cont    | css::#wb-main-in&#124;h1&#124;#wet-date-mod  |

Running grunt harvest on this [import.csv][importcsv] file you will end with an REST Route (among others) that will serve up that content via JSON (edited for readability):

```json
{
  "rows": [
    {
      "id": 1,
      "website": "http://wet-boew.github.io/wet-boew/index-en.html",
      "language": "en",
      "pattern": "wxt3",
      "title": "Web Experience Toolkit (WET)",
      "body": "\n<!-- MainContentStart -->\n\n\n<section><h2 id=\"about\">What is the Web Experience Toolkit?</h2>...</section></div>\n<!-- MainContentEnd -->\n"
    },
    {
      "id": 2,
      "website": "http://wet-boew.github.io/wet-boew/demos/theme-wet-boew/cont-en.html",
      "language": "en",
      "pattern": "wxt3",
      "title": "Content page - WET theme",
      "body": "\n<!-- MainContentStart -->\n\n\n<section><h2>Heading 2 (<code>h2</code>) - default appearance</h2>...<section></div>\n<!-- MainContentEnd -->\n"
    },
    {
      "id": 3,
      "website": "http://wet-boew.github.io/wet-boew/demos/grids/grid-base-en.html",
      "language": "en",
      "pattern": "wxt3",
      "title": "Grid system",
      "body": "\n<!-- MainContentStart -->\n\n\n<section><div class=\"wet-boew-prettify all-pre linenums\">...<section></div>\n<!-- MainContentEnd -->\n"
    },
  ],
  "rowCount": 3
}
```

After inspecting the JSON file above you will notice that our CSS selectors got converted from their DOM related counterparts into the actual html source. This conversion and a lot more happens when the harvest parses the data it receives.

## CSS3 DOM Selectors

NodeJS Harvester leverages cheerio which gives you a fast, flexible, and lean implementation of core jQuery implemented for the server.

[Cheerio][cheerio] allows for you to use related [CSS3 Selectors][selectors] to assist in your mappings among many other [helper functions][helper].

Based on the range of selectors we can use a more complicated query could be something like follows:

```css
css::body table:nth-child(3) tr td:nth-child(4) form[name~=content]
```

## Tokens

Aside from the `css::` token a range of other tokens can be added to the import.csv and will have additional logic attached to them.

The following is the current table of stable tokens along with their intended result.

| Token       | Description                                                                          |
| ---------   | ------------------------------------------------------------------------------------ |
| `css`       | Leverages [CSS Selectors][selectors] to extract markup.                              |
| `date`      | Converts a wide array of date strings into unix time leveraging [MomentJS][moment].   |
| `taxonomy`  | Support for a list of items separated by commas.                                     |

## Token Parameters

Currently the `css` token described above can have special parameters passed to it.

The following is the current table discussion this parameters along with their intended result.

| Parameter   | Description                                                                              |
| ----------- | ---------------------------------------------------------------------------------------- |
| `|`         | Will remove CSS DOM from the initial returned result from css token.                     |
| `~`         | Allows for you to pass a Cheerio Operator that the nodejs script will run as a callback. |

Based on the parameters above a query could resemble the following:

```css
css::body table .section|h1|parent()
```

The above simply states grab parent element of a query selector of 'body table .section' and then remove h1 from the result.

## Rest Routes

When the import.csv file is processed data is written to the database based on how the [config.yml][config] file was created.

Most of the defined tables inside the [sqlite][sqlite] database are passed to [Express][express] in order to rendered as [REST Routes][routes].

For every defined schema type in the [config.yml][config] file the following rest routes will be made (only global ones shown below):

| Route                    | Description                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `/[type]`                | Will render all limited subset of all records imported to verify no row missed.      |
| `/[type]/:id`            | Renders the full entity of an individual imported row for every defined csv field.   |
| `/join/[type]`           | In Development.                                                                      |
| `/join/[type]/:id`       | In Development.                                                                      |
| `/join/language/[type]`  | In Development.                                                                      |
| `/all/[type]`            | Renders 50 full entities of imported rows for every defined csv field.               |


<!-- Links Referenced -->

[config]:     http://github.com/nodejs-harvester/blob/master/config/config.yml.example
[cheerio]:    https://github.com/MatthewMueller/cheerio
[express]:    http://expressjs.com
[helper]:     http://sizzlejs.com
[jscs]:       https://github.com/gustavohenke/grunt-jscs-checker
[jshint]:     https://github.com/gruntjs/grunt-contrib-jshint
[grunt]:      http://gruntjs.com
[importcsv]:  http://github.com/nodejs-harvester/blob/master/import/import.csv
[methods]:    https://nodejs.org/en/download
[moment]:     http://momentjs.com
[node]:       http://nodejs.org
[nodemon]:    https://github.com/ChrisWren/grunt-nodemon
[routes]:     http://expressjs.com/3x/api.html#app.routes
[selectors]:  http://api.jquery.com/category/selectors
[sizzle]:     http://sizzlejs.com
[sqlite]:     http://www.sqlite.org/about.html
[uglify]:     https://github.com/gruntjs/grunt-contrib-uglify
