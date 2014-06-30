Ext.define('Rally.example.CollectionPromises', {
    extend: 'Rally.app.App',
    launch: function() {
        var that = this;
        var today = new Date().toISOString();
        var stories = Ext.create('Rally.data.wsapi.Store', {
            model: 'UserStory',
            fetch: ['Tasks'],
            filters: [
                {
                    property: 'Iteration.StartDate',
                    operator: '<=',
                    value: today
                },
                {
                    property: 'Iteration.EndDate',
                    operator: '>=',
                    value: today
                }
            ]
        });
        stories.load().then({
            success: this.loadTasks,
            scope: this
        }).then({
            success:function(results) {
                that.makeGrid(results);
            },
            failure: function(){
                console.log("oh noes!")
            }
        });
    },
    
    loadTasks: function(stories){
        console.log("load tasks",stories)
        var promises = [];
        _.each(stories, function(story){
            var tasks = story.get('Tasks');
            if (tasks.Count > 0) {
                tasks.store = story.getCollection('Tasks',{fetch:['Name','FormattedID','Estimate','State','Blocked','WorkProduct']});
                promises.push(tasks.store.load());
            }
        });
        return Deft.Promise.all(promises);
    },
    
     
    makeGrid: function(results){
        var tasks = _.flatten(results);
        var data = [];
        _.each(tasks, function(task){
            data.push(task.data);
        })
        
        _.each(data, function(record){
            record.Story = record.WorkProduct.FormattedID + " " + record.WorkProduct.Name;;
        })

        
        this.add({
            xtype: 'rallygrid',
            showPagingToolbar: true,
            showRowActionsColumn: true,
            editable: false,
            store: Ext.create('Rally.data.custom.Store', {
                data: data,
                groupField: 'Story',
            }),
            features: [{ftype:'groupingsummary'}],
            columnCfgs: [
                {
                    xtype: 'templatecolumn',text: 'ID',dataIndex: 'FormattedID',width: 100,
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate'),
                    summaryRenderer: function() {
                        return "Estimate Total"; 
                    }
                },
                {
                    text: 'Name',dataIndex: 'Name',
                },
                {
                    text: 'State',dataIndex: 'State',xtype: 'templatecolumn',
                        tpl: Ext.create('Rally.ui.renderer.template.ScheduleStateTemplate',
                            {
                                states: ['Defined', 'In-Progress', 'Completed'],
                                field: {
                                    name: 'State' 
                                }
                        })
                },
                {
                    text: 'Estimate',dataIndex: 'Estimate',
                    summaryType: 'sum',
                },
                {
                    text: 'WorkProduct',dataIndex: 'WorkProduct',
                    renderer: function(val, meta, record) {
                        return '<a href="https://rally1.rallydev.com/#/detail/userstory/' + record.get('WorkProduct').ObjectID + '" target="_blank">' + record.get('WorkProduct').FormattedID + '</a>';
                    }
                },
            ]
        });
        
    }
});

