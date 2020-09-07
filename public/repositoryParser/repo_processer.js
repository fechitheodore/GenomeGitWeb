module.exports = {

uploadFile: function(event) {
    this.parsingBool = true;
    const f = event.files[0]; // get the uploaded file
    const _this = this;

    let extension = f.name.split('.');
    extension = extension[extension.length - 1]; // extract the file extension
    if (extension[extension.length - 2])
      var ext2 = extension[extension.length - 2];
    if (!_this.userService.selectedProject) {
      _this.userService.selectedProject = { title: 'Project', id: '' };
    }

    // creating a new worker
    const worker = new Worker('parser_worker.js');

    // For bedcov uploading, check that an annotation File is selected
    if (extension === 'bedcov' || extension === 'results' || extension === 'de' || extension === 'txt' || ext2 === 'de') {
      let annotationFound = false;
      let annotationID;
      for (let i = 0; i < this.selectedFiles.length; i++) {
        if (annotationFound) {
          break;
        }

        for (let j = 0; j < this.annotationFiles.length; j++) {
          if (this.selectedFiles[i] == this.annotationFiles[j].id) {
            annotationFound = true;
            annotationID = this.selectedFiles[i];
            _this.fileForNextLoading = { file: annotationID, list: _this.preLoadedFiles };
            break;
          }
        }
      }
      if (!annotationFound) {
        alert("Please select an annotation file corresponding to the .bedcov before proceeding");
        _this.fileupload.clear();
        return;
      }
    }

    if (_this.selectedFastaIndex != null) {
      worker.postMessage([f, _this.userService.selectedProject.id, _this.userService.getToken(), _this.fastaFiles[_this.selectedFastaIndex].id, _this.fileForNextLoading, _this.chromosomeSignature, environment.production]);
    } else {
      worker.postMessage([f, _this.userService.selectedProject.id, _this.userService.getToken(), undefined, _this.fileForNextLoading, _this.chromosomeSignature, environment.production]);
    }
    _this.fileupload.clear();
    worker.onmessage = function(msg) {

      if (msg.data.error) {

        let summary;
        summary = msg.data.error.severity === 'warn' ? 'Warn Message' : 'Error Message';
        _this.toastr.error(summary, msg.data.error.message, { positionClass: 'toast-bottom-right' });

      } else {
        if (msg.data.projectID) {
          _this.userService.selectedProject.id = msg.data.projectID;
          _this.userService.selectedProject.title = msg.data.projectTitle;
        } else if (msg.data.IsBam) {
          alert("The BAI file should be uploaded first. You have entered BAM file, please first enter the corresponding BAI, then try again");
          /*_this.preLoadedFiles.set(msg.data.file, msg.data.format);
          _this.fileForNextLoading = { file: msg.data.file, list: _this.preLoadedFiles }*/
          //  console.log(  _this.fileForNextLoading);
          _this.fileupload.clear();
        } else if (msg.data.IsBai) {
          alert("You have entered BAI file, please now enter the corresponding BAM");
          _this.preLoadedFiles.set(msg.data.file, msg.data.format);
          _this.fileForNextLoading = { file: msg.data.file, list: _this.preLoadedFiles };
          //  console.log( _this.fileForNextLoading);
          _this.fileupload.clear();
        } else if (msg.data.init) {

          _this.uploads.push({ name: msg.data.name, value: 0 });

        } else {

          for (let i = 0; i < _this.uploads.length; i++) {

            if (_this.uploads[i].name === msg.data.name) {

              _this.uploads[i].value = Math.floor(msg.data.value);

              if (msg.data.value == 100 && msg.data.format) {

                const insertedFile = { name: msg.data.name, format: msg.data.format, id: msg.data.id };
                _this.populatePickList.push(insertedFile);

                if (msg.data.format === 'fasta') {
                  _this.fastaFiles.push(insertedFile);
                  _this.selectedFastaIndex = _this.fastaFiles.length - 1;
                  _this.toastr.warning('Warning message', 'Be sure to select the correct fasta file before uploading other files', { positionClass: 'toast-top-right' });
                } else if (msg.data.format === 'vcf') {
                  _this.vcfFiles.push(insertedFile)
                } else if (msg.data.format === 'annotation') {
                  _this.annotationFiles.push(insertedFile)
                } else if (msg.data.format === 'diff' || msg.data.format === 'de') {
                  _this.DEFiles.push(insertedFile)
                } else if (msg.data.format === 'bam' || msg.data.format === 'bai') {
                  _this.genomicCovFiles.push(insertedFile)
                } else if (msg.data.format === 'bedcov') {
                  _this.transcriptomicCovFiles.push(insertedFile)
                } else if (msg.data.format === 'results') {
                  _this.expressionFiles.push(insertedFile)
                }


                _this.onEmittingPopulatedPickList.emit(_this.populatePickList);

                _this.uploads.splice(i);
              }
            }
          }
        }
      }
    };
  }



}




