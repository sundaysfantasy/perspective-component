package org.fakester.common.component.display;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import org.fakester.common.RadComponents;


/**
 * Describes the component to the Java registry so the gateway and designer know to look for the front end elements.
 * In a 'common' scope so that it's referencable by both gateway and designer.
 */
public class SmartViewer {

    // unique ID of the component which perfectly matches that provided in the javascript's ComponentMeta implementation
    public static String COMPONENT_ID = "rad.display.smartViewer";

    /**
     * The schema provided with the component descriptor. Use a schema instead of a plain JsonObject because it gives
     * us a little more type information, allowing the designer to highlight mismatches where it can detect them.
     */
    public static JsonSchema SCHEMA =
        JsonSchema.parse(RadComponents.class.getResourceAsStream("/radsmartviewer.props.json"));

    /**
     * Components register with the Java side ComponentRegistry but providing a ComponentDescriptor.  Here we
     * build the descriptor for this one component. Icons on the component palette are optional.
     */
    public static ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
        .setPaletteCategory(RadComponents.COMPONENT_CATEGORY)
        .setId(COMPONENT_ID)
        .setModuleId(RadComponents.MODULE_ID)
        .setSchema(SCHEMA) //  this could alternatively be created purely in Java if desired
        .setName("Smart Viewer")
        .addPaletteEntry("", "Smart Viewer", "A 3d viewer component", null, null)
        .setDefaultMetaName("radSmartViewer")
        .setResources(RadComponents.BROWSER_RESOURCES)
        .build();

}
