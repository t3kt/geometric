const pattern4 = {
    name: 'pattern4',
    base: {
        sides: 6,
        radius: 0.1,
        attrs: {
            strokeColor: '#006633',
            strokeWidth: 3
        }
    },
    generators: [
        {
            id: 'gen1',
            type: 'regPolyOnEdge',
            sides: 5,
            source: {},
            attrs: {
                strokeColor: '#773366',
                strokeWidth: 5
            }
        },
        {
            id: 'gen2',
            type: 'regPolyOnEdge',
            sides: 5,
            source: {
                from: 'gen1',
                start: 3,
                end: 5
            },
            attrs: {
                strokeColor: '#688865',
                strokeWidth: 2
            }
        },
        {
            id: 'bridgegen1',
            type: 'lineBridgeOnEdge',
            steps: 4,
            source: {
                type: 'zip',
                source1: {from: 'gen1', indices: [1, 2]},
                source2: {from: 'gen1', indices: [2, 3]}
            },
            attrs: {
                strokeColor: '#FF0000'
            }
        },
        // {
        //     id: 'bridgegen2',
        //     type: 'lineBridgeOnEdge',
        //     steps: 4,
        //     source: {
        //         type: 'zip',
        //         source1: {from: 'gen1', indices: [3, 4]},
        //         source2: {from: 'gen2', indices: [1, 2]}
        //     },
        //     attrs: {
        //         strokeColor: '#342eff'
        //     }
        // }
    ]
};
module.exports = pattern4;