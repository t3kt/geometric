const pattern1 = {
    name: 'pattern1',
    base: {
        sides: 16,
        radius: 0.2,
        attrs: {
            strokeColor: '#7e77ff'
        }
    },
    generators: [
        {
            id: 'hexes',
            source: {step: 2},
            sides: 6,
            attrs: {
                strokeColor: '#426072'
            }
        },
        {
            id: 'squares',
            source: {start: 1, step: 2},
            sides: 4,
            attrs: {
                strokeColor: '#302f72',
                strokeWidth: 2,
                // fillColor: '#426072',
                // opacity: 0.6
            }
        },
        // {
        //     type: 'lineBridgeOnEdge',
        //     source: {from: 'squares', type: 'seq'},
        //     steps: 10,
        //     attrs: {
        //         strokeColor: '#b987ff',
        //         opacity: 0.5
        //     }
        // },
        {
            id: 'ring2',
            source: {from: 'hexes'},
            sides: 5,
            attrs: {
                strokeColor: '#308820',
                strokeWidth: 2,
                // fillColor: '#688865',
                // opacity: 0.6
            }
        },
        // {
        //     source: {from: 'ring2', type: 'seq'},
        //     type: 'lineBridgeOnEdge',
        //     steps: 10,
        //     attrs: {
        //         strokeColor: '#584c4a',
        //         opacity: 0.5
        //     }
        // },
        {
            id: 'pentas',
            source: {start: 1, step: 2},
            sides: 5,
            flip: true,
            attrs: {
                strokeColor: '#584c4a'
            }
        },
        // {
        //     type: 'lineBridgeOnEdge',
        //     source: {source: {from: 'pentas'}, type: 'seq'},
        //     steps: 8,
        //     attrs: {
        //         strokeColor: '#337900'
        //     }
        // }
    ]
};