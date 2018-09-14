const pattern2 = {
    name: 'pattern2',
    base: {
        sides: 14,
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
            id: 'ring2',
            source: {from: 'hexes'},
            sides: 5,
            attrs: {
                strokeColor: '#308820',
                strokeWidth: 2
            }
        },
        {
            source: {start: 1, step: 2},
            sides: 5,
            flip: true,
            attrs: {
                strokeColor: '#584c4a'
            }
        }
    ]
};