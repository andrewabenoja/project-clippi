import * as React from 'react';
import { connect } from 'react-redux';
import { iRootState, Dispatch, models } from '../store/rematch';
import { RematchDispatch, RematchRootState } from '@rematch/core';

const Count: React.FC<CountProps> = props => (
    <div>
        <h1>Sharks!</h1>
        The count is {props.count}
        <button onClick={props.increment}>increment</button>
        <button onClick={props.incrementAsync}>incrementAsync</button>
    </div>
);

const mapState = (state: iRootState) => ({
    count: state.sharks
});

// const mapDispatch = ({ count: { increment, incrementAsync } }) => ({
//     increment: () => increment(1),
//     incrementAsync: () => incrementAsync(1),
// })

const mapDispatch = (dispatch: RematchDispatch<models>) => {
    console.log(dispatch);
    return {
        increment: () => dispatch.sharks.increment(1),
        incrementAsync: () => dispatch.sharks.incrementAsync(1)
    };
};

interface CountProps
    extends Partial<ReturnType<typeof mapState>>,
        Partial<ReturnType<typeof mapDispatch>> {}

export const CountContainer = connect(mapState, mapDispatch as any)(Count);
