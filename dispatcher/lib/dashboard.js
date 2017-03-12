/**
 * Created by shirish.goyal on 2/26/17.
 */

import moment from 'moment';
import blessed from 'blessed';
import contrib from 'blessed-contrib';
import _ from 'lodash';

class Dashboard {
    constructor(config, logger, rows, cols, dispatcher) {
        this.config = config;
        this.logger = logger;
        this.dispatcher = dispatcher;

        this.screen = blessed.screen();
        this.grid = new contrib.grid({rows: rows, cols: cols, screen: this.screen});

        this.servers = ['US1', 'US2', 'EU1', 'AU1', 'AS1', 'JP1'];
        this.commands = ['grep', 'node', 'java', 'timer', '~/ls -l', 'netns', 'watchdog', 'gulp', 'tar -xvf', 'awk', 'npm install']
    }

    run() {
        let start = new Date();
        this.bpuUtilization(start, this.dispatcher);
        this.memoryUtilization(start);
        this.progressLog(start, this.servers, this.commands);
        this.status(start, this.dispatcher);

        this.screen.key(['escape', 'q', 'C-c'], (ch, key) => {
            return process.exit(0);
        });

        setInterval(() => {
            this.screen.render();
        }, 1000);
    }

    bpuUtilization(start, dispatcher) {
        var bar = this.grid.set(2, 0, 8, 6, contrib.bar,
            {
                label: 'BPU Utilization (%)'
                , barWidth: 5
                , barSpacing: 6
                , xOffset: 2
                , maxHeight: 10
            });

        function fillBar(bpuList) {
            var titles = Object.keys(bpuList);

            var arr = [];
            for (var i = 0; i < titles.length; i++) {
                arr.push(Math.round(Math.random() * 10))
            }
            bar.setData({titles: titles, data: arr})
        }

        setInterval(() => {
            fillBar(dispatcher.bpuList);
        }, 1000);
    }

    memoryUtilization(start) {
        var titles = ['Allocation', 'Used'];

        var bar = this.grid.set(2, 10, 6, 2, contrib.bar,
            {
                label: 'Memory Heap Utilization (%)'
                , barWidth: 12
                , barSpacing: 6
                , xOffset: 2
                , maxHeight: 100
            });

        function fillBar() {
            var mem = process.memoryUsage();
            var arr = [];
            arr.push(Math.round(mem.heapTotal * 100 / mem.rss));
            arr.push(Math.round(mem.heapUsed * 100 / mem.heapTotal));
            bar.setData({titles: titles, data: arr})
        }

        fillBar();
        setInterval(fillBar, 2000);
    }

    progressLog(start, dispatcher) {
        var log = this.grid.set(8, 8, 4, 4, contrib.log,
            {
                fg: "green"
                , selectedFg: "white"
                , label: 'Error Log'
            });

        setInterval(() => {
            log.log('');
        }, 1000);
    }

    status(start, dispatcher) {
        var chalk = require('chalk');

        var markdown = this.grid.set(0, 0, 2, 12, contrib.markdown, {
            code: chalk.yellow,
            blockquote: chalk.gray.italic,
            html: chalk.gray,
            heading: chalk.green.bold,
            firstHeading: chalk.magenta.underline.bold,
            hr: chalk.reset,
            listitem: chalk.reset,
            table: chalk.reset,
            paragraph: chalk.reset,
            strong: chalk.bold,
            em: chalk.italic,
            codespan: chalk.yellow,
            del: chalk.dim.gray.strikethrough,
            link: chalk.blue,
            href: chalk.blue.underline,
            // Reflow and print-out width
            width: 80, // only applicable when reflow is true
            reflowText: false,

            // Should it prefix headers?
            showSectionPrefix: true,

            // Whether or not to undo marked escaping
            // of entities (" -> &quot; etc)
            unescape: true,

            // Whether or not to show emojis
            emoji: true,

            // Options passed to cli-table
            tableOptions: {},

            // The size of tabs in number of spaces or as tab characters
            tab: 2, // examples: 4, 2, \t, \t\t,
            label: 'Interactive Microbiology Lab: Dispatcher'
        });

        setInterval(() => {
            let numClients = Object.keys(dispatcher.bpuList).length;
            markdown.setMarkdown('Started ' + moment(start).fromNow() + '\n' + numClients + ' clients connected' + '\n' + dispatcher.status);
        }, 1000);
    }
}

export {Dashboard};

(function () {



    /**
     * Donut Options
     self.options.radius = options.radius || 14; // how wide is it? over 5 is best
     self.options.arcWidth = options.arcWidth || 4; //width of the donut
     self.options.yPadding = options.yPadding || 2; //padding from the top
     */
    // var donut = grid.set(8, 8, 4, 2, contrib.donut,
    //     {
    //         label: 'Percent Donut',
    //         radius: 16,
    //         arcWidth: 4,
    //         yPadding: 2,
    //         data: [{label: 'Storage', percent: 87}]
    //     })

    // var latencyLine = grid.set(8, 8, 4, 2, contrib.line,
    //   { style:
    //     { line: "yellow"
    //     , text: "green"
    //     , baseline: "black"}
    //   , xLabelPadding: 3
    //   , xPadding: 5
    //   , label: 'Network Latency (sec)'})

    // var gauge = grid.set(8, 10, 2, 2, contrib.gauge, {label: 'Storage', percent: [80, 20]})
    // var gauge_two = grid.set(2, 9, 2, 3, contrib.gauge, {label: 'Deployment Progress', percent: 80})
    //
    // var sparkline = grid.set(10, 10, 2, 2, contrib.sparkline,
    //     {
    //         label: 'Throughput (bits/sec)'
    //         , tags: true
    //         , style: {fg: 'blue', titleFg: 'white'}
    //     })


    // var table = grid.set(4, 9, 4, 3, contrib.table,
    //     {
    //         keys: true
    //         , fg: 'green'
    //         , label: 'Active Processes'
    //         , columnSpacing: 1
    //         , columnWidth: [24, 10, 10]
    //     })

    /*
     *
     * LCD Options
     //these options need to be modified epending on the resulting positioning/size
     options.segmentWidth = options.segmentWidth || 0.06; // how wide are the segments in % so 50% = 0.5
     options.segmentInterval = options.segmentInterval || 0.11; // spacing between the segments in % so 50% = 0.5
     options.strokeWidth = options.strokeWidth || 0.11; // spacing between the segments in % so 50% = 0.5
     //default display settings
     options.elements = options.elements || 3; // how many elements in the display. or how many characters can be displayed.
     options.display = options.display || 321; // what should be displayed before anything is set
     options.elementSpacing = options.spacing || 4; // spacing between each element
     options.elementPadding = options.padding || 2; // how far away from the edges to put the elements
     //coloring
     options.color = options.color || "white";
     */
    // var lcdLineOne = grid.set(0, 9, 2, 3, contrib.lcd,
    //     {
    //         label: "LCD Test",
    //         segmentWidth: 0.06,
    //         segmentInterval: 0.11,
    //         strokeWidth: 0.1,
    //         elements: 5,
    //         display: 3210,
    //         elementSpacing: 4,
    //         elementPadding: 2
    //     }
    // );
    //
    // var errorsLine = grid.set(0, 6, 4, 3, contrib.line,
    //     {
    //         style: {
    //             line: "red"
    //             , text: "white"
    //             , baseline: "black"
    //         }
    //         , label: 'Errors Rate'
    //         , maxY: 60
    //         , showLegend: true
    //     })

    // var transactionsLine = grid.set(0, 0, 6, 6, contrib.line,
    //     {
    //         showNthLabel: 5
    //         , maxY: 100
    //         , label: 'Total Transactions'
    //         , showLegend: true
    //         , legend: {width: 10}
    //     })

    // var map = grid.set(6, 0, 6, 6, contrib.map, {label: 'Servers Location'})


//dummy data
//


//set dummy data on gauge
//     var gauge_percent = 0
//     setInterval(function () {
//         gauge.setData([gauge_percent, 100 - gauge_percent]);
//         gauge_percent++;
//         if (gauge_percent >= 100) gauge_percent = 0
//     }, 200)
//
//     var gauge_percent_two = 0
//     setInterval(function () {
//         gauge_two.setData(gauge_percent_two);
//         gauge_percent_two++;
//         if (gauge_percent_two >= 100) gauge_percent_two = 0
//     }, 200);


//set dummy data for table
//     function generateTable() {
//         var data = []
//
//         for (var i = 0; i < 30; i++) {
//             var row = []
//             row.push(commands[Math.round(Math.random() * (commands.length - 1))])
//             row.push(Math.round(Math.random() * 5))
//             row.push(Math.round(Math.random() * 100))
//
//             data.push(row)
//         }
//
//         table.setData({headers: ['Process', 'Cpu (%)', 'Memory'], data: data})
//     }
//
//     generateTable()
//     table.focus()
//     setInterval(generateTable, 3000)


//set log dummy data


//set spark dummy data
//     var spark1 = [1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5, 4, 4, 5, 4, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5]
//     var spark2 = [4, 4, 5, 4, 1, 5, 1, 2, 5, 2, 1, 5, 4, 4, 5, 4, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5]
//
//     refreshSpark()
//     setInterval(refreshSpark, 1000)
//
//     function refreshSpark() {
//         spark1.shift()
//         spark1.push(Math.random() * 5 + 1)
//         spark2.shift()
//         spark2.push(Math.random() * 5 + 1)
//         sparkline.setData(['Server1', 'Server2'], [spark1, spark2])
//     }


//set map dummy markers
//     var marker = true
//     setInterval(function () {
//         if (marker) {
//             map.addMarker({"lon": "-79.0000", "lat": "37.5000", color: 'yellow', char: 'X'})
//             map.addMarker({"lon": "-122.6819", "lat": "45.5200"})
//             map.addMarker({"lon": "-6.2597", "lat": "53.3478"})
//             map.addMarker({"lon": "103.8000", "lat": "1.3000"})
//         }
//         else {
//             map.clearMarkers()
//         }
//         marker = !marker
//         screen.render()
//     }, 1000)

//set line charts dummy data

//     var transactionsData = {
//         title: 'USA',
//         style: {line: 'red'},
//         x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40', '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00', '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20', '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
//         y: [0, 20, 40, 45, 45, 50, 55, 70, 65, 58, 50, 55, 60, 65, 70, 80, 70, 50, 40, 50, 60, 70, 82, 88, 89, 89, 89, 80, 72, 70]
//     }
//
//     var transactionsData1 = {
//         title: 'Europe',
//         style: {line: 'yellow'},
//         x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40', '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00', '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20', '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
//         y: [0, 5, 5, 10, 10, 15, 20, 30, 25, 30, 30, 20, 20, 30, 30, 20, 15, 15, 19, 25, 30, 25, 25, 20, 25, 30, 35, 35, 30, 30]
//     }
//
//     var errorsData = {
//         title: 'server 1',
//         x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25'],
//         y: [30, 50, 70, 40, 50, 20]
//     }
//
//     var latencyData = {
//         x: ['t1', 't2', 't3', 't4'],
//         y: [5, 1, 7, 5]
//     }
//
//     setLineData([transactionsData, transactionsData1], transactionsLine)
//     setLineData([errorsData], errorsLine)
// // setLineData([latencyData], latencyLine)
//
//     setInterval(function () {
//         setLineData([transactionsData, transactionsData1], transactionsLine)
//         screen.render()
//     }, 500)
//
//     setInterval(function () {
//         setLineData([errorsData], errorsLine)
//     }, 1500)

    // setInterval(function () {
    //     var colors = ['green', 'magenta', 'cyan', 'red', 'blue'];
    //     var text = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    //
    //     var value = Math.round(Math.random() * 100);
    //     lcdLineOne.setDisplay(value + text[value % 12]);
    //     lcdLineOne.setOptions({
    //         color: colors[value % 5],
    //         elementPadding: 4
    //     });
    //     screen.render()
    // }, 1500);
    //
    // var pct = 0.00;
    //
    // function updateDonut() {
    //     if (pct > 0.99) pct = 0.00;
    //     var color = "green";
    //     if (pct >= 0.25) color = "cyan";
    //     if (pct >= 0.5) color = "yellow";
    //     if (pct >= 0.75) color = "red";
    //     donut.setData([
    //         {percent: parseFloat((pct + 0.00) % 1).toFixed(2), label: 'storage', 'color': color}
    //     ]);
    //     pct += 0.01;
    // }
    //
    // setInterval(function () {
    //     updateDonut();
    //     screen.render()
    // }, 500)

    // function setLineData(mockData, line) {
    //     for (var i = 0; i < mockData.length; i++) {
    //         var last = mockData[i].y[mockData[i].y.length - 1]
    //         mockData[i].y.shift()
    //         var num = Math.max(last + Math.round(Math.random() * 10) - 5, 10)
    //         mockData[i].y.push(num)
    //     }
    //
    //     line.setData(mockData)
    // }
})();
