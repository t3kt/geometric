const pattern2 = {
    name: 'pattern2',
    base: {
        sides: 14,
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
            id: 'ring2',
            from: 'hexes',
            generators: {sides: 5},
            strokeColor: '#308820',
            strokeWidth: 2,
        },
        {
            edges: {start: 1, step: 2},
            generators: {sides: 5, flip: true},
            strokeColor: '#584c4a'
        }
    ]
};