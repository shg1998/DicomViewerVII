 cornerstoneTools.init([
            {
                moduleName: 'globalConfiguration',
                configuration: {
                    showSVGCursors: true
                }
            },
            {
                moduleName: 'segmentation',
                configuration: {
                    outlineWidth: 2
                }
            }
        ]);
        const imageIds = ['example://1', 'example://2', 'example://3'];
        const stack = {
            currentImageIdIndex: 0,
            imageIds: imageIds,
        };

        // Enable & Setup all of our elements
        const elements = document.querySelectorAll('.cornerstone-element');
        Array.from(elements).forEach(element => {
            cornerstone.enable(element);

            element.tabIndex = 0;
            element.focus();

            cornerstone.loadImage(imageIds[0]).then(function (image) {
                cornerstoneTools.addStackStateManager(element, ['stack']);
                cornerstone.displayImage(element, image);
                cornerstoneTools.addToolState(element, 'stack', stack);
            });

            //Save As Tool
            const index = element.getAttribute('data-index');
            const saveBtn = element.parentElement.querySelector(
                `a[data-index='${index}']`
            );
            saveBtn.addEventListener('click', evt => {
                cornerstoneTools.SaveAs(element, 'viewportImage.png');
            });

            // Log measurement events
            const { EVENTS } = cornerstoneTools;
            const log = event => {
                const type = `MEASUREMENT_${event.type
                    .replace('cornerstonetoolsmeasurement', '')
                    .toUpperCase()}`;
                const color = {
                    MEASUREMENT_ADDED: '#27e',
                    MEASUREMENT_MODIFIED: '#e72',
                    MEASUREMENT_COMPLETED: '#5b5',
                    MEASUREMENT_REMOVED: '#f55',
                }[type];

                const getData = detail => {
                    const { measurementData = {} } = detail;
                    const out = {};
                    const measurementKeys = [
                        'length',
                        'rAngle',
                        'value',
                        'text',
                        'str',
                        'text',
                        'longestDiameter',
                        'shortestDiameter',
                    ];

                    if (measurementData.cachedStats) {
                        Object.keys(measurementData.cachedStats).forEach(key => {
                            out[key] = measurementData.cachedStats[key];
                        });
                    }

                    measurementKeys.forEach(key => {
                        if (key in measurementData) {
                            out[key] = measurementData[key];
                        }
                    });

                    if (Object.keys(out).length === 0) {
                        return measurementData;
                    } else {
                        return JSON.stringify(out);
                    }
                };

                console.log(
                    '%c %s %c %s %c %o',
                    `background: ${color}; color: white; padding: 4px 0;`,
                    type,
                    // The tool type
                    `color: ${color}; font-family: monospace;`,
                    event.detail.toolInteraction || event.detail.toolName,
                    '',
                    getData(event.detail)
                    // event.detail
                );
            };
            element.addEventListener(EVENTS.MEASUREMENT_ADDED, log);
            element.addEventListener(EVENTS.MEASUREMENT_MODIFIED, log);
            element.addEventListener(EVENTS.MEASUREMENT_COMPLETED, log);
            element.addEventListener(EVENTS.MEASUREMENT_REMOVED, log);
        });

        // Iterate over all tool-category links
        const toolCategoryLinks = document.querySelectorAll(
            'ul.tool-category-list a'
        );
        const toolCategorySections = document.querySelectorAll('ul.tool-category');
        Array.from(toolCategoryLinks).forEach(link => {
            //
            const categoryName = link.getAttribute('data-category');
            const categoryElement = document.querySelector(
                `section[data-tool-category="${categoryName}"]`
            );

            // Setup listener
            link.addEventListener('click', evt => {
                evt.preventDefault();
                setToolCategoryActive(categoryName);
            });
        });

        // Iterate over all tool buttons
        const toolButtons = document.querySelectorAll('a[data-tool]');
        Array.from(toolButtons).forEach(toolBtn => {
            // Add the tool
            const toolName = toolBtn.getAttribute('data-tool');
            const apiTool = cornerstoneTools[`${toolName}Tool`];

            if (apiTool) {
                cornerstoneTools.addTool(apiTool);
            } else {
                console.warn(`unable to add tool with name ${toolName}Tool`);
                console.log(cornerstoneTools);
            }

            // Setup button listener
            // Prevent right click context menu for our menu buttons
            toolBtn.addEventListener(
                'contextmenu',
                event => event.preventDefault(),
                true
            );
            // Prevent middle click opening a new tab on Chrome & FF
            toolBtn.addEventListener(
                'auxclick',
                event => {
                    if (event.button && event.button === 1) {
                        event.preventDefault();
                    }
                },
                false
            );
            toolBtn.addEventListener('mousedown', evt => {
                const mouseButtonMask = evt.buttons
                    ? evt.buttons
                    : convertMouseEventWhichToButtons(evt.which);

                const toolInteraction = evt.target.getAttribute('data-tool-interaction');
                setButtonActive(toolName, mouseButtonMask, toolInteraction);
                cornerstoneTools.setToolActive(toolName, {
                    mouseButtonMask,
                    isTouchActive: true,
                });

                evt.preventDefault();
                evt.stopPropagation();
                evt.stopImmediatePropagation();
                return false;
            });
        });

        // Iterate through swtich ON/OFF tools
        const stateTools = document.querySelectorAll('input[type="checkbox"]');
        Array.from(stateTools).forEach(toolCheckBox => {
            const toolName = toolCheckBox.getAttribute('data-tool');
            const toolLabel = document.querySelector(`#${toolName}`);
            const apiTool = cornerstoneTools[`${toolName}Tool`];

            if (apiTool) {
                cornerstoneTools.addTool(apiTool);
            }

            cornerstoneTools.setToolDisabled(toolName);

            toolCheckBox.addEventListener('change', evt => {
                if (evt.currentTarget.checked) {
                    cornerstoneTools.setToolEnabled(toolName);
                } else {
                    cornerstoneTools.setToolDisabled(toolName);
                }

                const toolLabelId =
                    toolName.charAt(0).toLowerCase() + toolName.slice(1);
                const toolLabel = document.querySelector(`#${toolLabelId}`); //scaleOverlay or overlay
                toolLabel.classList.toggle('turned-on');
            });
        });

        // Activate first tool
        cornerstoneTools.setToolActive(
            cornerstoneTools.store.state.tools[0].name,
            {
                mouseButtonMask: 1,
                isTouchActive: true,
            }
        );

        const setToolCategoryActive = categoryName => {
            Array.from(toolCategoryLinks).forEach(toolLink => {
                if (categoryName === toolLink.getAttribute('data-category')) {
                    toolLink.classList.remove('active');
                    toolLink.classList.add('active');
                } else {
                    toolLink.classList.remove('active');
                }
            });

            Array.from(toolCategorySections).forEach(toolCategorySection => {
                if (
                    categoryName ===
                    toolCategorySection.getAttribute('data-tool-category')
                ) {
                    toolCategorySection.classList.remove('active');
                    toolCategorySection.classList.add('active');
                } else {
                    toolCategorySection.classList.remove('active');
                }
            });
        };

        const setButtonActive = (toolName, mouseButtonMask, toolInteraction) => {
            Array.from(toolButtons).forEach(toolBtn => {
                // Classes we need to set & remove
                let mouseButtonIcon = `mousebutton-${mouseButtonMask}`;
                let touchIcon = `touch-1`;

                // Update classes depending on the toolInteraction we clicked
                if (toolInteraction === 'none') {
                    return;
                } else if (toolInteraction === 'multitouch') {
                    mouseButtonIcon = null;
                    touchIcon = 'touch-2';
                } else if (toolInteraction === 'pinch') {
                    mouseButtonIcon = null;
                    touchIcon = 'touch-pinch';
                } else if (toolInteraction === 'wheel') {
                    mouseButtonIcon = 'mousebutton-wheel';
                    touchIcon = null;
                }

                // Update our target button
                if (toolName === toolBtn.getAttribute('data-tool')) {
                    toolBtn.className = '';
                    toolBtn.classList.add('active');
                    if (mouseButtonIcon) {
                        toolBtn.classList.add(mouseButtonIcon);
                    }
                    if (touchIcon) {
                        toolBtn.classList.add(touchIcon);
                    }
                    // Remove relevant classes from other buttons
                } else {
                    if (mouseButtonIcon && toolBtn.classList.contains(mouseButtonIcon)) {
                        toolBtn.classList.remove(mouseButtonIcon);
                    }
                    if (touchIcon && toolBtn.classList.contains(touchIcon)) {
                        toolBtn.classList.remove(touchIcon);
                    }
                    if (
                        toolBtn.classList.length === 1 &&
                        toolBtn.classList[0] === 'active'
                    ) {
                        toolBtn.classList.remove('active');
                    }
                }
            });
        };

        // Find all and configure each textMarkers
        const textMarkerTools = cornerstoneTools.store.state.tools.forEach(
            element => {
                if (element.name === 'TextMarker') {
                    element.configuration.markers = ['F5', 'F4', 'F3', 'F2', 'F1'];
                    element.configuration.current = 'F5';
                    element.configuration.ascending = true;
                    element.configuration.loop = true;
                }
            }
        );

        const convertMouseEventWhichToButtons = which => {
            switch (which) {
                // no button
                case 0:
                    return 0;
                // left
                case 1:
                    return 1;
                // middle
                case 2:
                    return 4;
                // right
                case 3:
                    return 2;
            }
            return 0;
        };