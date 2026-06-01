document.addEventListener('DOMContentLoaded', function () {
    const fileExplorerLauncher = document.querySelector('a[target="windowElement"][data-link="fileExplorer"]');
    if (!fileExplorerLauncher || fileExplorerLauncher.dataset.fileExplorerLoaderInit === 'true') {
        return;
    }

    fileExplorerLauncher.dataset.fileExplorerLoaderInit = 'true';
});
