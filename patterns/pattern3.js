const pattern3 = {
    name: 'pattern3',
    base: {
        sides: 10,
        radius: 0.15,
        strokeColor: '#6b3d75'
    },
    groups: [
        {
            id: 'pentagon1',
            // edges: {step: 3},
            generators: {sides: 5},
            strokeColor: '#302f72'
        },
        {
            id: 'square1',
            from: 'pentagon1',
            edges: {type: 'sides', sides: [3, 4]},
            generators: {sides: 4},
            strokeColor: '#426072',
            opacity: 0.9
        },
        {
            id: 'hexagon1',
            from: 'square1',
            // edges: {type: 'sides', sides: [3, 4]},
            generators: {sides: 6},
            strokeColor: '#308820',
            opacity: 0.8,
        },
        {
            from: 'square1',
            edges: 'stepwise',
            generators: {
                type: 'lineBridge',
                steps: 4
            },
            strokeColor: '#426072',
            opacity: 0.8
        },
        {
            from: 'hexagon1',
            edges: 'stepwise',
            generators: {
                type: 'lineBridge',
                steps: 4
            },
            strokeColor: '#426072',
            opacity: 0.5
        }
    ]
};