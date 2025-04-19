import * as React from 'react';
import {
    Component,
    ComponentMeta,
    ComponentProps,
    PComponent,
    PropertyTree,
    SizeObject
} from '@inductiveautomation/perspective-client';

export const COMPONENT_TYPE = "rad.display.smartViewer";

export interface SmartViewerProps {
    url: string; // calea relativă către o imagine din /webapps/main/models
}

export class SmartViewer extends Component<ComponentProps<SmartViewerProps>, any> {
    render() {
        const { props: { url }, emit } = this.props;

        // fallback dacă nu e setat
        const imageUrl = url || "/models/example.png";

        return (
            <img
                {...emit()}
                src={imageUrl}
                alt={`image-src-${imageUrl}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
        );
    }
}

export class SmartViewerMeta implements ComponentMeta {
    getComponentType(): string {
        return COMPONENT_TYPE;
    }

    getViewComponent(): PComponent {
        return SmartViewer;
    }

    getDefaultSize(): SizeObject {
        return {
            width: 360,
            height: 360
        };
    }

    getPropsReducer(tree: PropertyTree): SmartViewerProps {
        return {

            url: tree.readString("url", "/models/example.png")
        };
    }
}
//modificare git