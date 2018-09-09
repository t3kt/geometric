const pattern1 = {
    name: 'pattern1',
    base: {
        sides: 16,
        radius: 0.2,
        strokeColor: '#7e77ff'
    },
    groups: [
        {
            id: 'hexes',
            edges: {step: 2},
            generators: {sides: 6},
            strokeColor: '#426072'
        },
        {
            id: 'squares',
            edges: {start: 1, step: 2},
            generators: {sides: 4},
            strokeColor: '#302f72',
            strokeWidth: 2,
            // fillColor: '#426072',
            // opacity: 0.6
        },
        {
            from: 'squares',
            edges: 'stepwise',
            generators: {type: 'lineBridge', steps: 10},
            strokeColor: '#b987ff',
            opacity: 0.5,
        },
        {
            id: 'ring2',
            from: 'hexes',
            generators: {sides: 5},
            strokeColor: '#308820',
            strokeWidth: 2,
            // fillColor: '#688865',
            // opacity: 0.6
        },
        {
            from: 'ring2',
            edges: 'stepwise',
            generators: {type: 'lineBridge', steps: 10},
            strokeColor: '#584c4a',
            opacity: 0.5
        },
        {
            edges: {start: 1, step: 2},
            generators: {sides: 5, flip: true},
            strokeColor: '#584c4a'
        },
        {
            from: -1,
            edges: 'stepwise',
            generators: {type: 'lineBridge', steps: 8},
            strokeColor: '#337900'
        }
    ]
};