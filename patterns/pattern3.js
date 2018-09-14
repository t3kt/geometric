const pattern3 = {
    name: 'pattern3',
    base: {
        sides: 10,
        radius: 0.15,
        strokeColor: '#6b3d75'
    },
    generators: [
        {
            id: 'pentagon1',
            // source: {step: 3},
            sides: 5,
            attrs: {
                strokeColor: '#302f72'
            }
        },
        {
            id: 'square1',
            source: {from: 'pentagon1', indices: [3, 4]},
            sides: 4,
            attrs: {
                strokeColor: '#426072',
                opacity: 0.9
            }
        },
        {
            id: 'hexagon1',
            source: {
                from: 'square1',
                // indices: [3, 4]
            },
            sides: 6,
            attrs: {
                strokeColor: '#308820',
                opacity: 0.8,
            }
        },
        // {
        //     type: 'lineBridgeOnEdge',
        //     source: {source: {from: 'square1'}, type: 'seq'},
        //     steps: 4,
        //     attrs: {
        //         strokeColor: '#426072',
        //         opacity: 0.8
        //     }
        // },
        // {
        //     type: 'lineBridgeOnEdge',
        //     source: {source: {from: 'hexagon1'}, type: 'seq'},
        //     steps: 4,
        //     attrs: {
        //         strokeColor: '#426072',
        //         opacity: 0.5
        //     }
        // }
    ]
};