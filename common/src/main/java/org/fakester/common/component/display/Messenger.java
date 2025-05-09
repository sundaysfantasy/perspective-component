package org.fakester.common.component.display;

import java.util.List;

import com.inductiveautomation.ignition.common.gson.JsonObject;
import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import com.inductiveautomation.perspective.common.api.ComponentEventDescriptor;
import org.fakester.common.RadComponents;


/**
 * Common meta information about the Messenger component. See {@link SmartViewer} for docs on each field.
 */
public class Messenger {
    public static final String COMPONENT_ID = "rad.display.messenger";

    public static final JsonSchema SCHEMA =
        JsonSchema.parse(RadComponents.class.getResourceAsStream("/messenger.props.json"));

    public static final JsonSchema EVENT_SCHEMA;

    static {
        //JsonSchemas can also be constructed from Gson classes directly, but it's verbose and hard to read:
        JsonObject root = new JsonObject();
        JsonObject attributes = new JsonObject();
        JsonObject something = new JsonObject();
        something.addProperty("type", "string");
        something.addProperty("description", "Some property on your event object");
        attributes.add("something", something);
        root.add("properties", attributes);
        EVENT_SCHEMA = new JsonSchema(root);
    }

    public static ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
        .setPaletteCategory(RadComponents.COMPONENT_CATEGORY)
        .setId(COMPONENT_ID)
        .setModuleId(RadComponents.MODULE_ID)
        .setSchema(SCHEMA) //  this could alternatively be created purely in Java if desired
        .setName("Gateway Messenger")
        .setDefaultMetaName("messenger")
        .addPaletteEntry("", "Gateway Messenger", "A component that uses component messaging and data fetching delegates.", null, null)
        .setEvents(List.of(new ComponentEventDescriptor("onMessageEvent", "Description of your event", EVENT_SCHEMA)))
        .setResources(RadComponents.BROWSER_RESOURCES)
        .build();
}
