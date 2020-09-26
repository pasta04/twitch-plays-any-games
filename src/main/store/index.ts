import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import reducer from '../reducer';
import rootSaga from '../saga';
const composeEnhancers = compose;

export default function configureStore() {
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(reducer, composeEnhancers(applyMiddleware(sagaMiddleware)));
  if ((module as any).hot) {
    // Enable Webpack hot module replacement for reducers
    (module as any).hot.accept('../reducers', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nextRootReducer = require('../reducer/index');
      store.replaceReducer(nextRootReducer);
    });
  }

  sagaMiddleware.run(rootSaga);
  return store;
}
