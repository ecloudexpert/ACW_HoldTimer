({
    onInit : function(component, event, helper) {
        console.log('%c[ACW][INFO]','color:blue;background:yellow;','Setting up call state tracker...');
        helper.doInit(component,event);
    },
    handleTabClosed: function (component, event, helper) {  
        if (component.get('v.currentTabId') !== event.getParam('tabId')) {
            return;
        }
        if (component.get('v.voiceCall.VendorCallKey') === component.get('v.vendorKeyFromEvent')) {
            console.log('%c[ACW][INFO]','color:blue;background:yellow;','Vendor key matched with event.');
            helper.endTimer(component, 'acwTimer');
        }
    },
    updateTimerText: function (component, event, helper) {
        helper.updateTimer(component,event);
    },
    setFeaturePermissions : function(component, event, helper) {
		component.set("v.showACWTimer",event.getParam("showACWTime"));
        component.set("v.showHoldTimer",event.getParam("showHoldTime"));
	},
    handleVoiceCallsEvent: function (component, event, helper) {
        helper.handleVoiceCallsEvent(component,event);
    },
})