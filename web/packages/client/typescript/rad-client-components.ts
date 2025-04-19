import {ComponentMeta, ComponentRegistry} from '@inductiveautomation/perspective-client';
import { SmartViewer, SmartViewerMeta } from './components/SmartViewer';
import { MessengerComponent, MessengerComponentMeta } from './components/Messenger';
import { TagCounter, TagCounterMeta } from './components/TagCounter';

// export so the components are referencable, e.g. `RadComponents['Image']
export {SmartViewer, MessengerComponent, TagCounter};

import '../scss/main';

// as new components are implemented, import them, and add their meta to this array
const components: Array<ComponentMeta> = [
    new SmartViewerMeta(),
    new MessengerComponentMeta(),
    new TagCounterMeta()
];

// iterate through our components, registering each one with the registry.  Don't forget to register on the Java side too!
components.forEach((c: ComponentMeta) => ComponentRegistry.register(c) );
