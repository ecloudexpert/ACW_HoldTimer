({
    doInit: function(component, event){
        component.set('v.acwTimerObject',{
            'acwTimer': 0,
            'acwTimerString': '--:--:--',
            'acwTimerKey': 0
        });
        component.set('v.holdTimerObject',{
            'holdTimer': 0,
            'holdTimerString': '--:--:--',
            'holdTimerKey': 0
        });
        let workspaceAPI = component.find("workspace");
        workspaceAPI.getEnclosingTabId().then(function (tabId) {
            component.set('v.currentTabId', tabId);
        })
        .catch(function(error) {
            console.log('%c[ACW][ERROR]','color:red;background:yellow;','Getting tab information',error);
        });
        this.getRecordData(component, event);
        this.requestBrowserNotificationPermission(component);
    },

    handleVoiceCallsEvent: function (component, event, helper) {
        console.log('%c[ACW][INFO]','color:blue;background:yellow;','Call state detected: ', event.getParam('eventType'), ' for: ', event.getParam('eventData'));
        let eventType = event.getParam('eventType'), eventData = event.getParam('eventData');
        component.set('v.vendorKeyFromEvent', eventData.event ? eventData.event.callId : '');
        console.log('%c[ACW][INFO]','color:blue;background:yellow;','eventData.recordId  '+eventData.recordId);
        //Only perform action if the vendorCallKey of this record matches with event data and event was fired from assistant component on this record page
        if (component.get('v.recordId') === eventData.recordId) {
            console.log('%c[ACW][INFO]','color:blue;background:yellow;','Match condition eventData.recordId  ');
            this.fireVoiceCallsEvent(component, eventType, eventData);

            switch (eventType) {
                case 'callended':
                    if (component.get('v.holdTimerObject.holdTimerKey'))
                    {
                        this.endTimer(component, 'holdTimer');
                    }
                    this.startTimer(component, 'acwTimer');
                    break;
                case 'hold':
                    this.startTimer(component, 'holdTimer');
                    break;
                case 'resume':
                    this.endTimer(component, 'holdTimer');
                    break;
                default: //
                    break;
            }
        }
        else {
            console.log('%c[ACW][INFO]','color:blue;background:yellow;','Either the call key is not correct OR call has already completed OR record Id is not matching.');
        }
    },

    fireVoiceCallsEvent: function(component, eventName, eventData){
        console.log('%c[ACW][INFO]','color:blue;background:yellow;','e.VoiceCallsEvent  ');
        let voiceCallsEvent = $A.get("e.c:VoiceCallsEvent");
        voiceCallsEvent.setParams({ 
            "eventType" : eventName,
            "eventData": eventData
        });
        voiceCallsEvent.fire();
    },

    onInit: function (component, event) {
        this.getRecordData(component, event);
    },

    startTimer: function (component, type) {
        console.log('%c[ACW][INFO]','color:blue;background:yellow;','Starting tracking for: ' + type);
        const startDateTimeStamp = Date.now();

        let timerKey = setInterval(() => {
            this.handleTimers(component, type, startDateTimeStamp);
        }, 1000);
        component.set('v.' + type + 'Object.' + type + 'Key', timerKey);
        component.set('v.callHoldWarningDurationMet', false);
    },

    handleTimers: function (component, type, startDateTimeStamp) {
        const showBanners = component.get('v.showNotificationBanners');
        let timeDiff = Math.round((Date.now() - startDateTimeStamp)/1000);
        if (type === 'acwTimer') {
            let ct = component.get('v.acwTimerObject.acwTimer');
            component.set('v.acwTimerObject.acwTimer', timeDiff);
            if (parseInt(ct, 10) >= component.get('v.warningDuration') && parseInt(ct, 10) < component.get('v.timeOutDuration') && showBanners && !component.get('v.warningDurationMet')) {
                this.showToast('Warning', component.get('v.thresholdWarningMessage'), component.get('v.thresholdWarningBannerType'), component.get('v.warningToastMode') ? component.get('v.warningToastMode') : 'pester');
                this.fireVoiceCallsEvent(component, "acwWarning", component.get('v.thresholdWarningMessage'));
                this.showBrowserNotification(component, "Voice Call Warning", component.get('v.thresholdWarningMessage'));
                component.set('v.warningDurationMet', true);
            } else if (parseInt(ct, 10) >= component.get('v.timeOutDuration') && !component.get('v.timeoutDurationMet')) {
                this.fireVoiceCallsEvent(component, "acwTimeout", component.get('v.thresholdTimeoutMessage'));
                this.showBrowserNotification(component, "Voice Call Timeout", component.get('v.thresholdTimeoutMessage'));
                component.set('v.timeoutDurationMet', true);
                if (showBanners) {
                    this.showToast('Attention', component.get('v.thresholdTimeoutMessage'), component.get('v.thresholdTimeoutBannerType'), component.get('v.timeoutToastMode') ? component.get('v.timeoutToastMode') : 'sticky');
                }
                if (component.get('v.forceCloseOnTimeout')) {
                    this.getIdAndCloseTab(component);
                }
                if(component.get("v.openOmniChannelOnTimeout")){
                    this.fireVoiceCallsEvent(component, "openOmniChannel");
                }
            }
        }
        else if (type === 'holdTimer') {
            const showCallHoldBanners = component.get('v.showCallHoldNotificationBanners');
            let ct = timeDiff ;
            component.set('v.holdTimerObject.holdTimer', timeDiff ) ;
            if (parseInt(ct, 10) >= component.get('v.callholdWarningDuration') && showCallHoldBanners && !component.get('v.callHoldWarningDurationMet')) {
                this.showToast('Warning', component.get('v.callHoldWarningMessage') , 'Warning', 'pester');
                this.fireVoiceCallsEvent(component, component.get('v.callHoldWarningMessage'),  'Test Message');
                this.showCallHoldBrowserNotification(component, "Voice Call Hold Warning" ,component.get('v.callHoldWarningMessage'));
                component.set('v.callHoldWarningDurationMet', true);
            }
        }
        this.updateTimer(component, type);
    },
    
    updateTimer: function (component, type) {
        let timing;
        if (type === 'acwTimer') {
            timing = component.get('v.acwTimerObject.acwTimer');
            if (timing && timing !== NaN) {
                component.set('v.acwTimerObject.acwTimerString', this.getTimeWithUnit(timing, 'acwTimer'));
            }
        }
        else if (type === 'holdTimer') {
            timing = component.get('v.holdTimerObject.holdTimer');
            if (timing && timing !== NaN) {
                component.set('v.holdTimerObject.holdTimerString', this.getTimeWithUnit(timing, 'holdTimer'));
            }
        }
    },
    
    endTimer: function (component, type) {
        let timerKey = component.get('v.'+ type + 'Object.' + type + 'Key');
        window.clearInterval(timerKey);
        let voiceCall = component.get('v.voiceCall');
        if (type === 'acwTimer') {
            let acwTimer = component.get('v.timeoutDurationMet') && component.get('v.forceCloseOnTimeout') ? component.get('v.timeOutDuration') : component.get('v.acwTimerObject.acwTimer');
            voiceCall['After_Call_Work_Duration__c'] = acwTimer.toString();
        }
        else{
            component.set('v.lastHoldDurationInSeconds', component.get('v.holdTimerObject.holdTimer'));
        }
        component.set('v.voiceCall', voiceCall);
        this.setRecordData(component, type);
    },

    getTimeWithUnit: function (timeInSeconds) {
        return new Date(timeInSeconds * 1000).toISOString().slice(11, 19);
    },

    getRecordData: function(component,event){      
        var getVoiceCallRecord = component.get('c.getVoiceCall');
        getVoiceCallRecord.setParam("callId",component.get('v.recordId'));
        getVoiceCallRecord.setCallback(this, function(resp) {
            if(resp.getState() === 'SUCCESS'){
                component.set('v.voiceCall', resp.getReturnValue());
                
                let voiceCall = resp.getReturnValue();
                component.set('v.vendorKeyFromRecord', voiceCall['VendorCallKey']);
                if (voiceCall['After_Call_Work_Duration__c'] && !$A.util.isEmpty(voiceCall['After_Call_Work_Duration__c'])) {
                    component.set('v.acwTimerObject.acwTimer', parseInt(voiceCall['After_Call_Work_Duration__c'],10));
                    this.updateTimer(component, 'acwTimer');
                }
            }
            else if(resp.getState() === 'ERROR'){
                resp.getError().forEach((info) => console.log('[ACW][ERROR] Error occurred: ', info.message));
            }
            else {
                console.log('%c[ACW][ERROR]','color:red;background:yellow;','Apex call state:', resp.getState());
            }
        });
        $A.enqueueAction(getVoiceCallRecord);
    },

    setRecordData: function (component, event) {
        if(!component.get('v.saveTimeToRecord')){
            return;
        }
        
        let setVoiceCallRecord = component.get('c.setVoiceCall');
        console.log('[ACW]setting the data in voicecall');
        setVoiceCallRecord.setParams({
            voiceCall: component.get('v.voiceCall')
        });
        setVoiceCallRecord.setCallback(this, function(resp) {
            if(resp.getState() === 'SUCCESS'){
                //console.log(resp.getReturnValue());
            }
            else {
                resp.getError().forEach((info) => console.log('[ACW][ERROR] Error occurred: ', info.message));
            }
        });
        $A.enqueueAction(setVoiceCallRecord);
    },

    showToast : function(title, message, type, mode) {
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            title,
            message,
            type,
            mode
        });
        toastEvent.fire();
    },

    invokeCloseTab : function(component, tabId) {
        var workspaceAPI = component.find("workspace");
        workspaceAPI.closeTab({ tabId: tabId });
    },

    getTabInfo : function(component, tabId) {
        var workspaceAPI = component.find("workspace");
        workspaceAPI.getTabInfo({
            tabId: tabId
        }).then(function(response) {
            return response;
        });
        return undefined;
    },

    getEnclosingTabId: function (component) {
        return component.find("workspace").getEnclosingTabId();
    },

    getIdAndCloseTab: function (component) {
        this.getEnclosingTabId(component).then((res) => {
            this.invokeCloseTab(component, res);
        }).catch((err) => {
            console.log('[ACW][Error] Something went wrong: ', err);
        })
    },

    requestBrowserNotificationPermission: function(component){
        Notification.requestPermission().then((result) => {
            console.log("[ACW] [NP] : ", result);
            component.set("v.browserNotificationPermissionGranted", result);
        });
    },

    showBrowserNotification: function(component, notificationTitle, notificationMessage){
        let enableBrowserNotification = component.get("v.enableBrowserNotification");
        let browserNotificationPermissionGranted = component.get("v.browserNotificationPermissionGranted");
        if(enableBrowserNotification && (browserNotificationPermissionGranted === "granted")){
            let theBrowserNotification = new Notification(notificationTitle, { 
                body: notificationMessage
            });
            theBrowserNotification.addEventListener("click", event => {
                window.focus();
                theBrowserNotification.close();
            });
        }
        if(component.get("v.enableAudioNotification")){
            this.playNotificationAudio(component);
        }
    },

    showCallHoldBrowserNotification: function(component, notificationTitle, notificationMessage){
        let enableCallHoldBrowserNotification = component.get("v.enableCallHoldBrowserNotification");
        let browserNotificationPermissionGranted = component.get("v.browserNotificationPermissionGranted");
        if(enableCallHoldBrowserNotification && (browserNotificationPermissionGranted === "granted")){
            let theBrowserNotification = new Notification(notificationTitle, { 
                body: notificationMessage
            });
            theBrowserNotification.addEventListener("click", event => {
                window.focus();
                theBrowserNotification.close();
            });
        }
        if(component.get("v.enableCallholdAudioNotification")){
            this.playNotificationAudio(component);
        }
    },


    playNotificationAudio: function(component){
        let audioToPlay = component.get("v.notificationSoundUrl");
        if(!audioToPlay){
            audioToPlay = "/resource/ACWNotificationSound";
        }
        new Audio(audioToPlay).play()
        .then(result => console.log("Notification sound played."))
        .catch(error => console.log("Notification sound error", error));
    }
})